-- URGENT: Fix data amounts for correct package sorting
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Before: Show current problematic values
SELECT 
  'BEFORE FIX' as status,
  name,
  country_name,
  data_amount,
  'should be ' || 
  CASE 
    WHEN data_amount = 1024 THEN '1GB'
    WHEN data_amount = 3072 THEN '3GB'
    WHEN data_amount = 5120 THEN '5GB'
    WHEN data_amount = 10240 THEN '10GB'
    WHEN data_amount = 20480 THEN '20GB'
    WHEN data_amount = 30720 THEN '30GB'
    WHEN data_amount = 51200 THEN '50GB'
    ELSE 'unchanged'
  END as correct_value
FROM my_packages 
WHERE data_amount IN (1024, 3072, 5120, 10240, 20480, 30720, 51200)
ORDER BY data_amount;

-- Fix the double-converted values
UPDATE my_packages 
SET data_amount = 1, updated_at = NOW()
WHERE data_amount = 1024;

UPDATE my_packages 
SET data_amount = 3, updated_at = NOW()
WHERE data_amount = 3072;

UPDATE my_packages 
SET data_amount = 5, updated_at = NOW()
WHERE data_amount = 5120;

UPDATE my_packages 
SET data_amount = 10, updated_at = NOW()
WHERE data_amount = 10240;

UPDATE my_packages 
SET data_amount = 20, updated_at = NOW()
WHERE data_amount = 20480;

UPDATE my_packages 
SET data_amount = 30, updated_at = NOW()
WHERE data_amount = 30720;

UPDATE my_packages 
SET data_amount = 50, updated_at = NOW()
WHERE data_amount = 51200;

-- After: Verify the fixes - should show proper order
SELECT 
  'AFTER FIX' as status,
  name,
  country_name,
  data_amount || 'GB' as data_amount,
  sale_price,
  'Row ' || ROW_NUMBER() OVER (ORDER BY data_amount) as sort_order
FROM my_packages 
WHERE visible = true AND show_on_frontend = true
ORDER BY data_amount;

-- Final verification: Show expected frontend order
SELECT 
  'FRONTEND ORDER' as status,
  data_amount || 'GB' as data_amount,
  COUNT(*) as package_count
FROM my_packages 
WHERE visible = true AND show_on_frontend = true
GROUP BY data_amount
ORDER BY data_amount; 