-- Quick Data Integrity Check: Find mismatched entries in my_packages
-- Purpose: Identify any my_packages entries that don't have valid references in packages table
-- Run this in Supabase Dashboard → SQL Editor

-- MAIN CHECK: Find all my_packages entries without valid matches in packages
SELECT 
  mp.id,
  mp.name,
  mp.country_name,
  mp.data_amount,
  mp.sale_price,
  mp.updated_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ Package ID not found in source'
    WHEN p.country_name != mp.country_name THEN '⚠️ Country mismatch'
    ELSE '✅ Valid'
  END as status,
  p.country_name as source_country
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text  -- Fixed: Cast both to text
WHERE NOT EXISTS (
  SELECT 1 FROM packages p2 
  WHERE p2.id::text = mp.id::text  -- Fixed: Cast both to text
    AND p2.country_name = mp.country_name
)
ORDER BY 
  CASE 
    WHEN p.id IS NULL THEN 1  -- Missing IDs first
    ELSE 2                    -- Country mismatches second
  END,
  mp.country_name,
  mp.data_amount;

-- SUMMARY: Quick overview
SELECT 
  'Total my_packages' as metric,
  COUNT(*) as count
FROM my_packages

UNION ALL

SELECT 
  'Valid references' as metric,
  COUNT(*) as count
FROM my_packages mp
WHERE EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = mp.id::text AND p.country_name = mp.country_name  -- Fixed: Cast both to text
)

UNION ALL

SELECT 
  'Broken references' as metric,
  COUNT(*) as count
FROM my_packages mp
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = mp.id::text AND p.country_name = mp.country_name  -- Fixed: Cast both to text
)

UNION ALL

SELECT 
  'Integrity percentage' as metric,
  ROUND(
    (SELECT COUNT(*) FROM my_packages mp
     WHERE EXISTS (
       SELECT 1 FROM packages p 
       WHERE p.id::text = mp.id::text AND p.country_name = mp.country_name  -- Fixed: Cast both to text
     )) * 100.0 / COUNT(*), 
    1
  ) as count
FROM my_packages; 