-- SAFE PACKAGE ID REFERENCE FIX
-- Purpose: Update my_packages IDs to match current packages table
-- Strategy: Keep only ONE package per country/data combination to avoid duplicates
-- Run this in Supabase Dashboard → SQL Editor

-- STEP 1: Show current state
SELECT 
  'CURRENT STATE' as status,
  COUNT(*) as total_my_packages,
  COUNT(DISTINCT country_name || '_' || data_amount) as unique_combinations
FROM my_packages;

-- STEP 2: Find packages with multiple entries for same country/data
SELECT 
  'DUPLICATE COMBINATIONS' as status,
  country_name,
  data_amount,
  COUNT(*) as duplicate_count
FROM my_packages
GROUP BY country_name, data_amount
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, country_name;

-- STEP 3: Create safe mappings (keep only one package per country/data)
DROP TABLE IF EXISTS temp_safe_mappings;
CREATE TEMP TABLE temp_safe_mappings AS
WITH best_my_packages AS (
  -- From my_packages, keep only one per country/data combination
  SELECT 
    id as old_id,
    country_name,
    data_amount,
    name,
    sale_price,
    -- Keep the one with the lowest sale_price, or newest if same price
    ROW_NUMBER() OVER (
      PARTITION BY country_name, data_amount
      ORDER BY 
        CASE WHEN sale_price IS NULL THEN 1 ELSE 0 END,  -- Prefer packages with prices
        sale_price ASC,  -- Cheapest first
        updated_at DESC  -- Most recent first
    ) as rank
  FROM my_packages
),
best_packages AS (
  -- From packages, select best match for each country/data combination
  SELECT 
    id as new_id,
    country_name,
    REPLACE(data_amount, 'GB', '')::text as data_amount_clean,
    name,
    sale_price,
    days,
    ROW_NUMBER() OVER (
      PARTITION BY country_name, REPLACE(data_amount, 'GB', '')::text
      ORDER BY 
        CASE WHEN sale_price IS NULL THEN 1 ELSE 0 END,  -- Prefer packages with prices
        sale_price ASC,  -- Cheapest first
        CASE WHEN days IS NULL THEN 999 ELSE days END ASC  -- Shortest validity first
    ) as rank
  FROM packages
  WHERE data_amount LIKE '%GB'  -- Only include GB packages
)
SELECT 
  bmp.old_id,
  bp.new_id,
  bmp.country_name,
  bmp.data_amount,
  bp.name as new_name,
  bp.sale_price as new_price,
  bp.days as new_days
FROM best_my_packages bmp
INNER JOIN best_packages bp ON bmp.country_name = bp.country_name 
                            AND bmp.data_amount::text = bp.data_amount_clean
WHERE bmp.rank = 1 AND bp.rank = 1;  -- Only best matches

-- STEP 4: Show what will be updated
SELECT 
  'SAFE MAPPINGS CREATED' as status,
  COUNT(*) as packages_to_update,
  COUNT(DISTINCT country_name) as countries_affected
FROM temp_safe_mappings;

-- STEP 5: Show sample mappings
SELECT 
  country_name,
  data_amount || 'GB' as data_amount,
  new_name,
  new_price,
  new_days
FROM temp_safe_mappings
ORDER BY country_name, data_amount::numeric
LIMIT 10;

-- STEP 6: Remove packages that will become duplicates BEFORE updating
DELETE FROM my_packages 
WHERE id NOT IN (
  SELECT old_id FROM temp_safe_mappings
)
AND EXISTS (
  SELECT 1 FROM temp_safe_mappings tsm
  WHERE tsm.country_name = my_packages.country_name
    AND tsm.data_amount::text = my_packages.data_amount::text
);

-- STEP 7: Update remaining packages with new IDs
UPDATE my_packages 
SET 
  id = tm.new_id,
  updated_at = NOW()
FROM temp_safe_mappings tm
WHERE my_packages.id = tm.old_id;

-- STEP 8: Show update results
SELECT 
  'UPDATE COMPLETE' as status,
  COUNT(*) as packages_updated
FROM temp_safe_mappings;

-- STEP 9: Remove any remaining packages that couldn't be matched
DELETE FROM my_packages 
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = my_packages.id::text
);

-- STEP 10: Final integrity check
SELECT 
  'FINAL INTEGRITY CHECK' as status,
  COUNT(*) as total_my_packages,
  SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) as valid_references,
  ROUND(
    SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as integrity_percentage
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text;

-- STEP 11: Show final package distribution
SELECT 
  'FINAL DISTRIBUTION' as status,
  country_name,
  COUNT(*) as packages_count
FROM my_packages
GROUP BY country_name
ORDER BY packages_count DESC, country_name
LIMIT 15; 