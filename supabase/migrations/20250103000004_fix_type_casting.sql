-- FIXED: Handle type casting between TEXT and UUID
-- This addresses the "operator does not exist: text = uuid" error

-- First, let's see what's causing the problem (with proper type casting)
SELECT 
    'PROBLEMATIC RECORDS' as status,
    mp.id,
    mp.name,
    mp.reseller_id,
    'This reseller_id does not exist in packages table' as issue
FROM my_packages mp
WHERE mp.reseller_id IS NOT NULL 
  AND mp.reseller_id NOT IN (SELECT id::text FROM packages)
LIMIT 10;

-- Show count of problematic records (with type casting)
SELECT 
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_reseller_id,
    COUNT(CASE WHEN reseller_id IS NOT NULL AND reseller_id NOT IN (SELECT id::text FROM packages) THEN 1 END) as orphaned_records
FROM my_packages;

-- Clean up orphaned records (set reseller_id to NULL where no matching package exists)
UPDATE my_packages 
SET reseller_id = NULL
WHERE reseller_id IS NOT NULL 
  AND reseller_id NOT IN (SELECT id::text FROM packages);

-- Show cleanup results
SELECT 
    COUNT(*) as total_my_packages_after_cleanup,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_valid_reseller_id,
    COUNT(CASE WHEN reseller_id IS NULL THEN 1 END) as with_null_reseller_id
FROM my_packages;

-- Now convert reseller_id column from TEXT to UUID
-- But first, we need to handle any remaining non-UUID values
UPDATE my_packages 
SET reseller_id = NULL
WHERE reseller_id IS NOT NULL 
  AND reseller_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Convert the column type
ALTER TABLE my_packages 
ALTER COLUMN reseller_id TYPE uuid 
USING reseller_id::uuid;

-- Now create the foreign key constraint
ALTER TABLE my_packages
ADD CONSTRAINT fk_my_packages_reseller_id
FOREIGN KEY (reseller_id)
REFERENCES packages(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_my_packages_reseller_id_fk ON my_packages(reseller_id);

-- Add comment
COMMENT ON COLUMN my_packages.reseller_id IS 'Foreign key to packages.id - enables PostgREST joins';

-- Final verification
SELECT 
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_valid_fk_references
FROM my_packages;

SELECT 'SUCCESS: Type casting fixed, orphaned records cleaned, foreign key constraint created!' as result; 