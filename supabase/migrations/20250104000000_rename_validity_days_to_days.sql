-- Migration to rename validity_days to days in packages and my_packages tables
-- This aligns with Roamify API which returns "days" field

-- Step 1: Rename validity_days to days in packages table
ALTER TABLE packages RENAME COLUMN validity_days TO days;

-- Step 2: Drop old constraint and add new one for packages
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_validity_days_check;
ALTER TABLE packages ADD CONSTRAINT packages_days_check CHECK (days > 0);

-- Step 3: Rename validity_days to days in my_packages table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'my_packages' AND column_name = 'validity_days') THEN
    ALTER TABLE my_packages RENAME COLUMN validity_days TO days;
  END IF;
END $$;

-- Step 4: Drop old constraint and add new one for my_packages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'my_packages' AND column_name = 'days') THEN
    ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_validity_days_check;
    ALTER TABLE my_packages ADD CONSTRAINT my_packages_days_check CHECK (days > 0);
  END IF;
END $$;

-- Step 5: Update any existing NULL days values to a default
UPDATE packages SET days = 30 WHERE days IS NULL OR days <= 0;
UPDATE my_packages SET days = 30 WHERE days IS NULL OR days <= 0; 