-- Package Integrity Verification SQL Script
-- This script verifies that all package IDs in my_packages.reseller_id exist in packages.id
-- Run this in Supabase SQL editor for quick verification

-- =============================================================================
-- STEP 1: Table Statistics
-- =============================================================================
SELECT 
  'Table Statistics' as check_type,
  (SELECT COUNT(*) FROM packages) as packages_count,
  (SELECT COUNT(*) FROM my_packages) as my_packages_count,
  (SELECT COUNT(*) FROM my_packages WHERE reseller_id IS NOT NULL) as my_packages_with_reseller_id,
  (SELECT COUNT(*) FROM my_packages WHERE reseller_id IS NULL) as my_packages_without_reseller_id;

-- =============================================================================
-- STEP 2: Find Orphaned Records (my_packages.reseller_id not in packages.id)
-- =============================================================================
SELECT 
  'Orphaned Records' as check_type,
  mp.id as my_package_id,
  mp.name as package_name,
  mp.country_name,
  mp.reseller_id as orphaned_reseller_id,
  mp.created_at
FROM my_packages mp
LEFT JOIN packages p ON p.id::text = mp.reseller_id
WHERE mp.reseller_id IS NOT NULL 
  AND p.id IS NULL
ORDER BY mp.created_at DESC;

-- =============================================================================
-- STEP 3: Count Orphaned Records
-- =============================================================================
SELECT 
  'Orphaned Count' as check_type,
  COUNT(*) as orphaned_records_count
FROM my_packages mp
LEFT JOIN packages p ON p.id::text = mp.reseller_id
WHERE mp.reseller_id IS NOT NULL 
  AND p.id IS NULL;

-- =============================================================================
-- STEP 4: Find Duplicate reseller_id in my_packages
-- =============================================================================
SELECT 
  'Duplicate Reseller IDs' as check_type,
  reseller_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as my_package_ids,
  array_agg(name) as package_names
FROM my_packages 
WHERE reseller_id IS NOT NULL
GROUP BY reseller_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- =============================================================================
-- STEP 5: Find my_packages without reseller_id
-- =============================================================================
SELECT 
  'Missing Reseller IDs' as check_type,
  id as my_package_id,
  name as package_name,
  country_name,
  created_at
FROM my_packages 
WHERE reseller_id IS NULL
ORDER BY created_at DESC;

-- =============================================================================
-- STEP 6: Valid References Summary
-- =============================================================================
SELECT 
  'Valid References Summary' as check_type,
  COUNT(*) as total_valid_references
FROM my_packages mp
INNER JOIN packages p ON p.id::text = mp.reseller_id
WHERE mp.reseller_id IS NOT NULL;

-- =============================================================================
-- STEP 7: Complete Health Check Summary
-- =============================================================================
WITH stats AS (
  SELECT 
    COUNT(*) as total_my_packages,
    COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_reseller_id,
    COUNT(CASE WHEN reseller_id IS NULL THEN 1 END) as without_reseller_id
  FROM my_packages
),
orphaned AS (
  SELECT COUNT(*) as orphaned_count
  FROM my_packages mp
  LEFT JOIN packages p ON p.id::text = mp.reseller_id
  WHERE mp.reseller_id IS NOT NULL AND p.id IS NULL
),
duplicates AS (
  SELECT COUNT(*) as duplicate_groups
  FROM (
    SELECT reseller_id
    FROM my_packages 
    WHERE reseller_id IS NOT NULL
    GROUP BY reseller_id
    HAVING COUNT(*) > 1
  ) dup
),
valid_refs AS (
  SELECT COUNT(*) as valid_references
  FROM my_packages mp
  INNER JOIN packages p ON p.id::text = mp.reseller_id
  WHERE mp.reseller_id IS NOT NULL
)
SELECT 
  'HEALTH CHECK SUMMARY' as check_type,
  s.total_my_packages,
  s.with_reseller_id,
  s.without_reseller_id,
  v.valid_references,
  o.orphaned_count,
  d.duplicate_groups,
  CASE 
    WHEN o.orphaned_count = 0 AND d.duplicate_groups = 0 AND s.without_reseller_id = 0 THEN '✅ HEALTHY'
    WHEN o.orphaned_count > 0 THEN '❌ ORPHANED RECORDS FOUND'
    WHEN d.duplicate_groups > 0 THEN '⚠️ DUPLICATES FOUND'
    WHEN s.without_reseller_id > 0 THEN '⚠️ MISSING RESELLER IDS'
    ELSE '⚠️ ISSUES DETECTED'
  END as health_status
FROM stats s, orphaned o, duplicates d, valid_refs v;

-- =============================================================================
-- STEP 8: Sample of Valid Relationships (for verification)
-- =============================================================================
SELECT 
  'Sample Valid Relationships' as check_type,
  mp.id as my_package_id,
  mp.name as my_package_name,
  mp.reseller_id,
  p.id as packages_id,
  p.name as packages_name,
  p.country_name as packages_country
FROM my_packages mp
INNER JOIN packages p ON p.id::text = mp.reseller_id
WHERE mp.reseller_id IS NOT NULL
ORDER BY mp.created_at DESC
LIMIT 5;

-- =============================================================================
-- QUICK VERIFICATION QUERY (Run this for a quick check)
-- =============================================================================
/*
-- Uncomment and run this single query for a quick health check:

SELECT 
  (SELECT COUNT(*) FROM packages) as packages_total,
  (SELECT COUNT(*) FROM my_packages) as my_packages_total,
  (SELECT COUNT(*) FROM my_packages WHERE reseller_id IS NOT NULL) as with_reseller_id,
  (SELECT COUNT(*) FROM my_packages mp INNER JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL) as valid_references,
  (SELECT COUNT(*) FROM my_packages mp LEFT JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL AND p.id IS NULL) as orphaned_records,
  CASE 
    WHEN (SELECT COUNT(*) FROM my_packages mp LEFT JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL AND p.id IS NULL) = 0 
    THEN '✅ ALL GOOD - No orphaned records' 
    ELSE '❌ ISSUES FOUND - Check detailed queries above' 
  END as status;
*/ 