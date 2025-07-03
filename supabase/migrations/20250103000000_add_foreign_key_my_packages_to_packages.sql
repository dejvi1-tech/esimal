-- Migration: Add foreign key relationship between my_packages.reseller_id and packages.id
-- This will enable Supabase PostgREST to perform joins between the tables

-- Step 1: Convert my_packages.reseller_id from TEXT to UUID
-- First, check if any reseller_id values are not valid UUIDs and handle them

-- Create a backup column to store old reseller_id values
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS old_reseller_id text;

-- Backup existing reseller_id values
UPDATE my_packages 
SET old_reseller_id = reseller_id 
WHERE reseller_id IS NOT NULL AND old_reseller_id IS NULL;

-- Update reseller_id to NULL for any non-UUID values to prevent conversion errors
UPDATE my_packages 
SET reseller_id = NULL 
WHERE reseller_id IS NOT NULL 
  AND reseller_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Convert the reseller_id column from TEXT to UUID
ALTER TABLE my_packages 
ALTER COLUMN reseller_id TYPE uuid 
USING reseller_id::uuid;

-- Step 2: Try to restore valid UUID values from backup
-- This will only work for values that are actually valid UUIDs
UPDATE my_packages 
SET reseller_id = old_reseller_id::uuid
WHERE reseller_id IS NULL 
  AND old_reseller_id IS NOT NULL
  AND old_reseller_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Step 3: Add the foreign key constraint
ALTER TABLE my_packages
ADD CONSTRAINT fk_my_packages_reseller_id
FOREIGN KEY (reseller_id)
REFERENCES packages(id)
ON DELETE CASCADE;

-- Step 4: Create index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_my_packages_reseller_id_fk 
ON my_packages(reseller_id);

-- Step 5: Add comment to document the relationship
COMMENT ON COLUMN my_packages.reseller_id IS 'Foreign key reference to packages.id - enables PostgREST joins';

-- Optional: Clean up the backup column after verification (uncomment if desired)
-- ALTER TABLE my_packages DROP COLUMN IF EXISTS old_reseller_id; 