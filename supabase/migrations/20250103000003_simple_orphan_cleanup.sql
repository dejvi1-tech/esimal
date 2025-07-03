-- SIMPLE FIX: Remove orphaned records from my_packages
-- This addresses the foreign key constraint violation

-- First, let's see what's causing the problem
SELECT 
    'PROBLEMATIC RECORDS' as status,
    mp.id,
    mp.name,
    mp.reseller_id,
    'This reseller_id does not exist in packages table' as issue
FROM my_packages mp
WHERE mp.reseller_id IS NOT NULL 
  AND mp.reseller_id NOT IN (SELECT id FROM packages)
LIMIT 10;

-- Show count of problematic records
SELECT 
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_reseller_id,
    COUNT(CASE WHEN reseller_id IS NOT NULL AND reseller_id NOT IN (SELECT id FROM packages) THEN 1 END) as orphaned_records
FROM my_packages;

-- OPTION 1: Set orphaned reseller_id to NULL (preserves records)
UPDATE my_packages 
SET reseller_id = NULL
WHERE reseller_id IS NOT NULL 
  AND reseller_id NOT IN (SELECT id FROM packages);

-- OPTION 2: Alternative - Delete orphaned records entirely (uncomment if preferred)
-- DELETE FROM my_packages 
-- WHERE reseller_id IS NOT NULL 
--   AND reseller_id NOT IN (SELECT id FROM packages);

-- Verify the cleanup
SELECT 
    COUNT(*) as total_my_packages_after_cleanup,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_valid_reseller_id,
    COUNT(CASE WHEN reseller_id IS NULL THEN 1 END) as with_null_reseller_id
FROM my_packages;

-- Now the foreign key constraint should work
-- (Run this separately after the above cleanup)
SELECT 'Orphaned records cleaned up. You can now create the foreign key constraint.' as message; 