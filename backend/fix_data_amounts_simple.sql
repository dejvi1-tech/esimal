-- FIX DATA AMOUNTS IN MY_PACKAGES TABLE
-- This script fixes the data amount conversion bug where values like 3072 should be 3 GB
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Show current problematic packages
SELECT 
  'CURRENT PROBLEMATIC PACKAGES' as status,
  id,
  name,
  country_name,
  data_amount as current_amount,
  CASE 
    WHEN data_amount = 1024 THEN 1
    WHEN data_amount = 3072 THEN 3
    WHEN data_amount = 5120 THEN 5
    WHEN data_amount = 10240 THEN 10
    WHEN data_amount = 15360 THEN 15
    WHEN data_amount = 20480 THEN 20
    WHEN data_amount = 30720 THEN 30
    WHEN data_amount = 51200 THEN 50
    WHEN data_amount > 100 AND data_amount % 1024 = 0 THEN data_amount / 1024
    ELSE data_amount
  END as should_be_amount,
  sale_price,
  days
FROM my_packages 
WHERE data_amount IN (1024, 3072, 5120, 10240, 15360, 20480, 30720, 51200)
   OR (data_amount > 100 AND data_amount % 1024 = 0)
ORDER BY data_amount DESC;

-- Step 2: Count how many packages will be affected
SELECT 
  'PACKAGES TO BE FIXED' as status,
  COUNT(*) as count
FROM my_packages 
WHERE data_amount IN (1024, 3072, 5120, 10240, 15360, 20480, 30720, 51200)
   OR (data_amount > 100 AND data_amount % 1024 = 0);

-- Step 3: Fix known conversion patterns
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
WHERE data_amount IN (1024, 3072, 5120, 10240, 15360, 20480, 30720, 51200);

-- Step 4: Fix other multiples of 1024 that are > 100 (likely incorrect conversions)
UPDATE my_packages 
SET 
  data_amount = data_amount / 1024,
  updated_at = NOW()
WHERE data_amount > 100 
  AND data_amount % 1024 = 0
  AND data_amount / 1024 <= 100; -- Only convert if result is reasonable (≤100GB)

-- Step 5: Show the fix results
SELECT 
  'FIXED PACKAGES' as status,
  COUNT(*) as total_packages,
  MIN(data_amount) as min_data_gb,
  MAX(data_amount) as max_data_gb,
  AVG(data_amount) as avg_data_gb
FROM my_packages;

-- Step 6: Show any remaining suspicious packages (>100GB)
SELECT 
  'STILL SUSPICIOUS (>100GB)' as status,
  id,
  name,
  country_name,
  data_amount,
  sale_price
FROM my_packages 
WHERE data_amount > 100
ORDER BY data_amount DESC
LIMIT 10;

-- Step 7: Show sample of fixed packages by country
SELECT 
  'SAMPLE FIXED PACKAGES' as status,
  country_name,
  COUNT(*) as package_count,
  MIN(data_amount) as min_gb,
  MAX(data_amount) as max_gb,
  AVG(data_amount) as avg_gb
FROM my_packages
GROUP BY country_name
ORDER BY package_count DESC
LIMIT 15;

-- Step 8: Final verification - should show no packages with suspicious amounts
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No suspicious data amounts found'
    ELSE '⚠️ WARNING: ' || COUNT(*) || ' packages still have suspicious amounts'
  END as final_status
FROM my_packages 
WHERE data_amount > 100; 