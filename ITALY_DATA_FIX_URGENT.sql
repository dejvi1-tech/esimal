-- URGENT: Fix Italy 15360 GB Issue
-- Problem: Italy package showing 15360 GB (15 Terabytes) instead of 15 GB
-- This is the same double-conversion bug we fixed before
-- Date: 2025-07-03

-- STEP 1: Find the problematic Italy package
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  '🚨 PROBLEMATIC PACKAGE' as status
FROM my_packages 
WHERE country_name = 'Italy' 
  AND data_amount = 15360;

-- STEP 2: Fix the Italy package with 15360 GB → 15 GB
UPDATE my_packages 
SET 
  data_amount = 15,
  updated_at = NOW()
WHERE country_name = 'Italy' 
  AND data_amount = 15360;

-- STEP 3: Check for any other massive data amounts in ANY country
SELECT 
  country_name,
  id,
  name,
  data_amount,
  CASE 
    WHEN data_amount = 1024 THEN 1
    WHEN data_amount = 3072 THEN 3
    WHEN data_amount = 5120 THEN 5
    WHEN data_amount = 10240 THEN 10
    WHEN data_amount = 15360 THEN 15
    WHEN data_amount = 20480 THEN 20
    WHEN data_amount = 30720 THEN 30
    WHEN data_amount = 51200 THEN 50
    ELSE data_amount
  END as correct_amount,
  '⚠️ NEEDS FIX' as status
FROM my_packages 
WHERE data_amount > 100
ORDER BY data_amount DESC;

-- STEP 4: Fix ALL packages with massive data amounts
UPDATE my_packages 
SET 
  data_amount = CASE 
    WHEN data_amount = 1024 THEN 1
    WHEN data_amount = 3072 THEN 3
    WHEN data_amount = 5120 THEN 5
    WHEN data_amount = 10240 THEN 10
    WHEN data_amount = 15360 THEN 15
    WHEN data_amount = 20480 THEN 20
    WHEN data_amount = 30720 THEN 30
    WHEN data_amount = 51200 THEN 50
    ELSE data_amount
  END,
  updated_at = NOW()
WHERE data_amount > 100;

-- STEP 5: Verify fix - should show no packages > 100 GB
SELECT 
  country_name,
  COUNT(*) as problematic_count,
  MAX(data_amount) as max_data_gb
FROM my_packages 
WHERE data_amount > 100
GROUP BY country_name;

-- STEP 6: Show Italy packages after fix (should be normal now)
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  '✅ FIXED' as status
FROM my_packages 
WHERE country_name = 'Italy'
ORDER BY data_amount;

-- STEP 7: Final verification - all countries max data amounts
SELECT 
  country_name,
  COUNT(*) as package_count,
  MIN(data_amount) as min_gb,
  MAX(data_amount) as max_gb,
  CASE 
    WHEN MAX(data_amount) > 100 THEN '❌ STILL HAS ISSUES'
    ELSE '✅ LOOKS GOOD'
  END as status
FROM my_packages 
GROUP BY country_name 
ORDER BY MAX(data_amount) DESC; 