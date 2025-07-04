-- Comprehensive Data Integrity Check: Find package mismatches and inconsistencies (FIXED for UUID/TEXT types)
-- Purpose: Validate my_packages table against packages table for purchase flow integrity
-- Run this in Supabase Dashboard → SQL Editor or via Node.js script

-- CORE CHECK: All my_packages entries must have valid package references
SELECT 
  'Data Integrity Check' as category,
  'my_packages → packages validation' as description,
  COUNT(*) as total_entries,
  SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) as missing_package_ids,
  SUM(CASE WHEN p.id IS NOT NULL AND p.country_name != mp.country_name THEN 1 ELSE 0 END) as country_mismatches,
  SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) as valid_references,
  ROUND(
    SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as integrity_percentage
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text  -- Fixed: Cast both to text
GROUP BY category, description;

-- DETAILED BROKEN REFERENCES: Show all problematic entries
SELECT 
  mp.id,
  mp.name,
  mp.country_name,
  mp.data_amount,
  mp.sale_price,
  mp.updated_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ Package ID not found in source'
    WHEN p.country_name != mp.country_name THEN '⚠️ Country mismatch: ' || p.country_name || ' vs ' || mp.country_name
    ELSE '✅ Valid'
  END as issue_type,
  p.country_name as source_country_name,
  p.data_amount as source_data_amount,
  p.sale_price as source_sale_price
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

-- COUNTRY CONSISTENCY CHECK: Verify all countries have valid packages
SELECT 
  mp.country_name,
  COUNT(*) as my_packages_count,
  COUNT(DISTINCT p.id) as matching_packages_count,
  SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) as missing_count,
  SUM(CASE WHEN p.id IS NOT NULL AND p.country_name != mp.country_name THEN 1 ELSE 0 END) as country_mismatch_count,
  CASE 
    WHEN SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) > 0 THEN '❌ Missing packages'
    WHEN SUM(CASE WHEN p.id IS NOT NULL AND p.country_name != mp.country_name THEN 1 ELSE 0 END) > 0 THEN '⚠️ Country mismatches'
    ELSE '✅ All valid'
  END as status
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text  -- Fixed: Cast both to text
GROUP BY mp.country_name
ORDER BY 
  CASE 
    WHEN SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) > 0 THEN 1
    WHEN SUM(CASE WHEN p.id IS NOT NULL AND p.country_name != mp.country_name THEN 1 ELSE 0 END) > 0 THEN 2
    ELSE 3
  END,
  mp.country_name;

-- DATA AMOUNT CONSISTENCY CHECK: Find unusual data amounts
SELECT 
  'Data Amount Analysis' as category,
  'Unusual data amounts (>100GB or <1GB)' as description,
  COUNT(*) as total_packages,
  SUM(CASE WHEN mp.data_amount > 100 THEN 1 ELSE 0 END) as over_100gb,
  SUM(CASE WHEN mp.data_amount < 1 THEN 1 ELSE 0 END) as under_1gb,
  MIN(mp.data_amount) as min_data_amount,
  MAX(mp.data_amount) as max_data_amount,
  ROUND(AVG(mp.data_amount), 2) as avg_data_amount
FROM my_packages mp
WHERE EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = mp.id::text  -- Fixed: Cast both to text
    AND p.country_name = mp.country_name
)
GROUP BY category, description;

-- PRICE CONSISTENCY CHECK: Compare prices with source packages
SELECT 
  mp.country_name,
  mp.name,
  mp.sale_price as my_price,
  p.sale_price as source_price,
  ABS(mp.sale_price - p.sale_price) as price_difference,
  CASE 
    WHEN ABS(mp.sale_price - p.sale_price) > 1 THEN '⚠️ Price difference > $1'
    ELSE '✅ Price matches'
  END as price_status
FROM my_packages mp
INNER JOIN packages p ON mp.id::text = p.id::text  -- Fixed: Cast both to text
WHERE p.country_name = mp.country_name
  AND ABS(mp.sale_price - p.sale_price) > 0.01  -- Show only packages with price differences
ORDER BY ABS(mp.sale_price - p.sale_price) DESC
LIMIT 20;

-- FEATURE VALIDATION: Check if features column is populated
SELECT 
  'Features Column Check' as category,
  COUNT(*) as total_packages,
  SUM(CASE WHEN mp.features IS NULL THEN 1 ELSE 0 END) as null_features,
  SUM(CASE WHEN mp.features = '{}' THEN 1 ELSE 0 END) as empty_features,
  SUM(CASE WHEN mp.features IS NOT NULL AND mp.features != '{}' THEN 1 ELSE 0 END) as populated_features,
  ROUND(
    SUM(CASE WHEN mp.features IS NOT NULL AND mp.features != '{}' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as populated_percentage
FROM my_packages mp
WHERE EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = mp.id::text  -- Fixed: Cast both to text
    AND p.country_name = mp.country_name
)
GROUP BY category;

-- FINAL SUMMARY: Overall system health
SELECT 
  'System Health Summary' as category,
  'Overall data integrity status' as description,
  COUNT(*) as total_my_packages,
  SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) as valid_packages,
  SUM(CASE WHEN p.id IS NULL OR p.country_name != mp.country_name THEN 1 ELSE 0 END) as broken_packages,
  ROUND(
    SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as system_integrity_percentage,
  CASE 
    WHEN SUM(CASE WHEN p.id IS NULL OR p.country_name != mp.country_name THEN 1 ELSE 0 END) = 0 THEN '🟢 EXCELLENT - All packages valid'
    WHEN SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 95 THEN '🟡 GOOD - Minor issues'
    WHEN SUM(CASE WHEN p.id IS NOT NULL AND p.country_name = mp.country_name THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 80 THEN '🟠 ATTENTION - Significant issues'
    ELSE '🔴 CRITICAL - Major integrity problems'
  END as health_status
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text  -- Fixed: Cast both to text
GROUP BY category, description; 