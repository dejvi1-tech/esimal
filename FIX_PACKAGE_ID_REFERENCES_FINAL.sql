-- FINAL PACKAGE ID REFERENCE FIX WITH PROPER FOREIGN KEY HANDLING
-- Purpose: Update my_packages IDs while preserving user_orders references
-- Strategy: Insert new packages first, update references, then clean up old ones
-- Run this in Supabase Dashboard → SQL Editor

-- STEP 1: Check current state
SELECT 
  'CURRENT STATE' as status,
  (SELECT COUNT(*) FROM my_packages) as total_my_packages,
  (SELECT COUNT(*) FROM user_orders) as total_user_orders,
  (SELECT COUNT(DISTINCT package_id) FROM user_orders) as packages_with_orders;

-- STEP 2: Create mappings for packages that can be matched
DROP TABLE IF EXISTS temp_package_mappings;
CREATE TEMP TABLE temp_package_mappings AS
WITH best_my_packages AS (
  -- From my_packages, keep only one per country/data combination
  SELECT 
    id as old_id,
    country_name,
    data_amount,
    name,
    sale_price,
    days,
    visible,
    region,
    most_popular,
    features,
    created_at,
    updated_at,
    -- Keep the one with the most orders first, then cheapest price
    ROW_NUMBER() OVER (
      PARTITION BY country_name, data_amount
      ORDER BY 
        (SELECT COUNT(*) FROM user_orders WHERE package_id = my_packages.id) DESC,  -- Most orders first
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
  COALESCE(bp.sale_price, bmp.sale_price) as new_price,
  COALESCE(bp.days, bmp.days) as new_days,
  bmp.visible,
  bmp.region,
  bmp.most_popular,
  bmp.features,
  bmp.created_at,
  (SELECT COUNT(*) FROM user_orders WHERE package_id = bmp.old_id) as order_count
FROM best_my_packages bmp
INNER JOIN best_packages bp ON bmp.country_name = bp.country_name 
                            AND bmp.data_amount::text = bp.data_amount_clean
WHERE bmp.rank = 1 AND bp.rank = 1;  -- Only best matches

-- STEP 3: Show what will be updated
SELECT 
  'MAPPINGS CREATED' as status,
  COUNT(*) as packages_to_update,
  COUNT(DISTINCT country_name) as countries_affected,
  SUM(order_count) as total_orders_affected
FROM temp_package_mappings;

-- STEP 4: Show sample mappings
SELECT 
  country_name,
  data_amount || 'GB' as data_amount,
  new_name,
  new_price,
  new_days,
  order_count
FROM temp_package_mappings
ORDER BY order_count DESC, country_name
LIMIT 10;

-- STEP 5: Insert new package records with correct IDs
INSERT INTO my_packages (
  id, name, country_name, data_amount, sale_price, days, 
  visible, region, most_popular, features, created_at, updated_at
)
SELECT 
  new_id, new_name, country_name, data_amount, new_price, new_days,
  visible, region, most_popular, features, created_at, NOW()
FROM temp_package_mappings
WHERE new_id NOT IN (SELECT id FROM my_packages);  -- Only insert if not already exists

-- STEP 6: Show insertion results
SELECT 
  'NEW PACKAGES INSERTED' as status,
  COUNT(*) as packages_inserted
FROM my_packages mp
INNER JOIN temp_package_mappings tm ON mp.id = tm.new_id;

-- STEP 7: Update user_orders to point to new package IDs
UPDATE user_orders
SET package_id = tm.new_id
FROM temp_package_mappings tm
WHERE user_orders.package_id = tm.old_id;

-- STEP 8: Show user_orders update results
SELECT 
  'USER_ORDERS UPDATED' as status,
  COUNT(*) as orders_updated
FROM user_orders uo
INNER JOIN temp_package_mappings tm ON uo.package_id = tm.new_id;

-- STEP 9: Delete old package records that are no longer referenced
DELETE FROM my_packages 
WHERE id IN (SELECT old_id FROM temp_package_mappings);

-- STEP 10: Delete packages that couldn't be matched and have no orders
DELETE FROM my_packages 
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.country_name = my_packages.country_name
    AND REPLACE(p.data_amount, 'GB', '') = my_packages.data_amount::text
)
AND NOT EXISTS (
  SELECT 1 FROM user_orders WHERE package_id = my_packages.id
);

-- STEP 11: Show cleanup results
SELECT 
  'CLEANUP COMPLETE' as status,
  COUNT(*) as old_packages_removed
FROM temp_package_mappings;

-- STEP 12: Final integrity check
SELECT 
  'FINAL INTEGRITY CHECK' as status,
  COUNT(*) as total_my_packages,
  SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) as valid_references,
  SUM(CASE WHEN p.id IS NULL AND EXISTS(SELECT 1 FROM user_orders WHERE package_id = mp.id) THEN 1 ELSE 0 END) as orphaned_with_orders,
  ROUND(
    SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as integrity_percentage
FROM my_packages mp
LEFT JOIN packages p ON mp.id::text = p.id::text;

-- STEP 13: Show final package distribution
SELECT 
  'FINAL DISTRIBUTION' as status,
  country_name,
  COUNT(*) as packages_count,
  SUM(CASE WHEN EXISTS(SELECT 1 FROM user_orders WHERE package_id = my_packages.id) THEN 1 ELSE 0 END) as with_orders
FROM my_packages
GROUP BY country_name
ORDER BY packages_count DESC, country_name
LIMIT 15;

-- STEP 14: Show any remaining unmatched packages
SELECT 
  'REMAINING UNMATCHED PACKAGES' as status,
  mp.country_name,
  mp.data_amount,
  mp.name,
  CASE WHEN EXISTS(SELECT 1 FROM user_orders WHERE package_id = mp.id) THEN 'Has Orders' ELSE 'No Orders' END as order_status
FROM my_packages mp
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id::text = mp.id::text
)
ORDER BY mp.country_name, mp.data_amount::numeric; 