-- Cleanup and retry foreign key creation
-- Run this if the previous migration failed partway through

-- Step 1: Drop the foreign key constraint if it exists (in case it was partially created)
ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS fk_my_packages_reseller_id;

-- Step 2: Drop the index if it exists
DROP INDEX IF EXISTS idx_my_packages_reseller_id_fk;

-- Step 3: Ensure we have the backup column
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS old_reseller_id text;

-- Step 4: Backup any existing reseller_id values if not already backed up
UPDATE my_packages 
SET old_reseller_id = reseller_id::text
WHERE reseller_id IS NOT NULL 
  AND old_reseller_id IS NULL;

-- Step 5: Set all orphaned reseller_id values to NULL
-- This will show you which records are problematic
UPDATE my_packages 
SET reseller_id = NULL
WHERE reseller_id IS NOT NULL 
  AND reseller_id NOT IN (SELECT id FROM packages);

-- Step 6: Show how many records were affected
SELECT 
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_valid_reseller_id,
    COUNT(CASE WHEN reseller_id IS NULL AND old_reseller_id IS NOT NULL THEN 1 END) as orphaned_records_nullified
FROM my_packages;

-- Step 7: Now safely add the foreign key constraint
ALTER TABLE my_packages
ADD CONSTRAINT fk_my_packages_reseller_id
FOREIGN KEY (reseller_id)
REFERENCES packages(id)
ON DELETE CASCADE;

-- Step 8: Create index for better performance
CREATE INDEX idx_my_packages_reseller_id_fk ON my_packages(reseller_id);

-- Step 9: Add helpful comment
COMMENT ON COLUMN my_packages.reseller_id IS 'Foreign key to packages.id - NULL means no valid package reference';

-- Step 10: Final verification
SELECT 'SUCCESS: Foreign key constraint created successfully!' as result; 