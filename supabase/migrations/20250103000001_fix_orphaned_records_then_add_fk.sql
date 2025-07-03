-- Migration: Fix orphaned records and add foreign key relationship
-- This addresses the foreign key constraint violation error

-- Step 1: Check and report orphaned records
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM my_packages mp
    LEFT JOIN packages p ON p.id::text = mp.old_reseller_id OR p.id = mp.reseller_id
    WHERE (mp.reseller_id IS NOT NULL OR mp.old_reseller_id IS NOT NULL)
      AND p.id IS NULL;
    
    RAISE NOTICE 'Found % orphaned records in my_packages', orphaned_count;
END $$;

-- Step 2: Show sample orphaned records for debugging
SELECT 
    'ORPHANED RECORDS' as status,
    mp.id as my_package_id,
    mp.name as package_name,
    mp.reseller_id,
    mp.old_reseller_id,
    'NOT FOUND IN packages' as issue
FROM my_packages mp
LEFT JOIN packages p ON p.id = mp.reseller_id
WHERE mp.reseller_id IS NOT NULL 
  AND p.id IS NULL
LIMIT 5;

-- Step 3: Fix orphaned records by setting reseller_id to NULL
-- This preserves the data but removes the invalid foreign key references
UPDATE my_packages 
SET reseller_id = NULL
WHERE reseller_id IS NOT NULL 
  AND reseller_id NOT IN (SELECT id FROM packages);

-- Step 4: Report what was fixed
SELECT 
    'FIXED ORPHANED RECORDS' as status,
    COUNT(*) as records_with_null_reseller_id,
    COUNT(CASE WHEN old_reseller_id IS NOT NULL THEN 1 END) as records_with_backup
FROM my_packages 
WHERE reseller_id IS NULL;

-- Step 5: Now safely add the foreign key constraint
ALTER TABLE my_packages
ADD CONSTRAINT fk_my_packages_reseller_id
FOREIGN KEY (reseller_id)
REFERENCES packages(id)
ON DELETE CASCADE;

-- Step 6: Create index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_my_packages_reseller_id_fk 
ON my_packages(reseller_id);

-- Step 7: Add comment to document the relationship
COMMENT ON COLUMN my_packages.reseller_id IS 'Foreign key reference to packages.id - enables PostgREST joins';

-- Step 8: Report final status
SELECT 
    'FINAL STATUS' as status,
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_valid_reseller_id,
    COUNT(CASE WHEN reseller_id IS NULL THEN 1 END) as with_null_reseller_id,
    COUNT(CASE WHEN old_reseller_id IS NOT NULL THEN 1 END) as with_backup_id
FROM my_packages;

-- Success message
SELECT 'SUCCESS: Foreign key constraint added. Orphaned records have reseller_id set to NULL (but preserved old_reseller_id for reference)' as message; 