-- Fix massive data amounts caused by double-conversion bug
-- Run this in Supabase SQL Editor to fix the immediate issue

-- Fix common double-converted values
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

-- Verify the fixes
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  updated_at
FROM my_packages 
WHERE data_amount IN (1, 3, 5, 10, 20, 30, 50)
ORDER BY country_name, data_amount; 