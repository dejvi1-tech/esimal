-- Fix days field mapping: rename validity_days to days in my_packages table
-- This aligns with Roamify API which returns "days" field

-- Step 1: Add new 'days' column
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS days integer;

-- Step 2: Copy data from validity_days to days (if validity_days exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'my_packages' AND column_name = 'validity_days') THEN
        UPDATE my_packages SET days = validity_days WHERE validity_days IS NOT NULL;
    END IF;
END $$;

-- Step 3: Drop old validity_days column (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'my_packages' AND column_name = 'validity_days') THEN
        ALTER TABLE my_packages DROP COLUMN validity_days;
    END IF;
END $$;

-- Step 4: Add constraint to ensure days is positive (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'my_packages' AND constraint_name = 'my_packages_days_check') THEN
        ALTER TABLE my_packages ADD CONSTRAINT my_packages_days_check CHECK (days > 0);
    END IF;
END $$;

-- Step 5: Update any existing NULL days values to a default
UPDATE my_packages SET days = 30 WHERE days IS NULL OR days <= 0; 