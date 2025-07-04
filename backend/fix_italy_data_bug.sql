-- Fix Italy Data Amount Bug
-- Problem: Italy package showing 15360 GB (15 Terabytes) instead of correct amount
-- Date: 2025-07-03

-- Step 1: Identify the problematic Italy packages
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  '--- PROBLEM PACKAGE ---' as status
FROM my_packages 
WHERE country_name = 'Italy' 
  AND data_amount > 100  -- Anything over 100GB is likely wrong
ORDER BY data_amount DESC;

-- Step 2: Show all Italy packages for context
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  updated_at
FROM my_packages 
WHERE country_name = 'Italy'
ORDER BY data_amount;

-- Step 3: Check if this is a known conversion pattern
-- 15360 could be: 15 * 1024 = 15360 (15GB → 15360MB → incorrectly stored as 15360GB)
-- Let's check what the correct value should be by looking at the name

SELECT 
  id,
  name,
  data_amount,
  CASE 
    WHEN data_amount = 15360 THEN 15
    WHEN data_amount = 10240 THEN 10
    WHEN data_amount = 5120 THEN 5
    WHEN data_amount = 3072 THEN 3
    WHEN data_amount = 1024 THEN 1
    WHEN data_amount = 20480 THEN 20
    WHEN data_amount = 30720 THEN 30
    WHEN data_amount = 51200 THEN 50
    ELSE data_amount
  END as correct_data_amount,
  'Auto-detected from pattern' as fix_method
FROM my_packages 
WHERE country_name = 'Italy' 
  AND data_amount > 100;

-- Step 4: Fix the Italy data amounts
-- This will convert the double-converted values back to correct GB amounts
UPDATE my_packages 
SET 
  data_amount = CASE 
    WHEN data_amount = 15360 THEN 15
    WHEN data_amount = 10240 THEN 10
    WHEN data_amount = 5120 THEN 5
    WHEN data_amount = 3072 THEN 3
    WHEN data_amount = 1024 THEN 1
    WHEN data_amount = 20480 THEN 20
    WHEN data_amount = 30720 THEN 30
    WHEN data_amount = 51200 THEN 50
    ELSE data_amount
  END,
  updated_at = NOW()
WHERE country_name = 'Italy' 
  AND data_amount > 100;

-- Step 5: Verify the fix - should show normal data amounts
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  'AFTER FIX' as status
FROM my_packages 
WHERE country_name = 'Italy'
ORDER BY data_amount;

-- Step 6: Check for similar issues in other countries
SELECT 
  country_name,
  COUNT(*) as packages_with_massive_data,
  MAX(data_amount) as max_data_gb,
  MIN(data_amount) as min_data_gb
FROM my_packages 
WHERE data_amount > 100  -- Flag anything over 100GB as suspicious
GROUP BY country_name
ORDER BY MAX(data_amount) DESC;

-- Step 7: Final verification - should return 0 rows
SELECT 
  country_name,
  COUNT(*) as problematic_packages
FROM my_packages 
WHERE data_amount > 100
GROUP BY country_name; 