-- AUTOMATIC PACKAGE ID REFERENCE FIX
-- Purpose: Update my_packages IDs to match current packages table
-- Strategy: Match by country_name + data_amount, select cheapest option
-- Run this in Supabase Dashboard → SQL Editor

-- STEP 1: Create temporary table with new ID mappings
DROP TABLE IF EXISTS temp_package_mappings;
CREATE TEMP TABLE temp_package_mappings AS
WITH ranked_packages AS (
  SELECT 
    p.id as new_id,
    p.country_name,
    REPLACE(p.data_amount, 'GB', '')::text as data_amount_clean,
    p.name,
    p.sale_price,
    p.days,
    -- Rank by price (cheapest first), then by days (shortest first)
    ROW_NUMBER() OVER (
      PARTITION BY p.country_name, REPLACE(p.data_amount, 'GB', '')::text
      ORDER BY 
        CASE WHEN p.sale_price IS NULL THEN 1 ELSE 0 END,  -- Prefer packages with prices
        p.sale_price ASC,  -- Cheapest first
        CASE WHEN p.days IS NULL THEN 999 ELSE p.days END ASC  -- Shortest validity first
    ) as rank
  FROM packages p
  WHERE p.data_amount LIKE '%GB'  -- Only include GB packages
)
SELECT 
  mp.id as old_id,
  rp.new_id,
  mp.country_name,
  mp.data_amount,
  rp.name as new_name,
  rp.sale_price as new_price,
  rp.days as new_days
FROM my_packages mp
INNER JOIN ranked_packages rp ON mp.country_name = rp.country_name 
                               AND mp.data_amount::text = rp.data_amount_clean
WHERE rp.rank = 1;  -- Only select best match

-- STEP 2: Show what will be updated
SELECT 
  'PREVIEW: Packages to be updated' as status,
  COUNT(*) as total_packages,
  COUNT(DISTINCT country_name) as countries_affected
FROM temp_package_mappings;

-- STEP 3: Show sample mappings
SELECT 
  country_name,
  data_amount || 'GB' as data_amount,
  new_name,
  new_price,
  new_days
FROM temp_package_mappings
ORDER BY country_name, data_amount::numeric
LIMIT 10;

-- STEP 4: Update my_packages with new IDs
UPDATE my_packages 
SET 
  id = tm.new_id,
  updated_at = NOW()
FROM temp_package_mappings tm
WHERE my_packages.id = tm.old_id;

-- STEP 5: Show results
SELECT 
  'UPDATE COMPLETE' as status,
  COUNT(*) as packages_updated
FROM temp_package_mappings;

-- STEP 6: Clean up packages that couldn't be matched
DELETE FROM my_packages 
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = my_packages.id::text
);

-- STEP 7: Final integrity check
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

-- STEP 8: Show countries that couldn't be matched
SELECT 
  'UNMATCHED COUNTRIES' as status,
  mp.country_name,
  mp.data_amount,
  COUNT(*) as count
FROM my_packages mp
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.country_name = mp.country_name 
    AND REPLACE(p.data_amount, 'GB', '') = mp.data_amount::text
)
GROUP BY mp.country_name, mp.data_amount
ORDER BY mp.country_name; 