-- Fix country labeling for packages with inconsistent country names
-- Problem: Packages with name "Europe & United States eSIM Package" have country_name = "Germany" or other incorrect values
-- Solution: Update country_name to match the actual package type

-- First, show packages that need fixing
SELECT 
  id,
  name,
  country_name,
  data_amount,
  sale_price
FROM my_packages 
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States'
ORDER BY data_amount;

-- Update all packages with "Europe & United States eSIM Package" name 
-- to have correct country_name
UPDATE my_packages 
SET 
  country_name = 'Europe & United States',
  updated_at = NOW()
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States';

-- Verify the fix
SELECT 
  id,
  name,
  country_name,
  data_amount,
  sale_price
FROM my_packages 
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States';

-- Show summary of all Europe & United States packages after fix
SELECT 
  data_amount,
  days,
  sale_price,
  COUNT(*) as count
FROM my_packages 
WHERE country_name = 'Europe & United States'
GROUP BY data_amount, days, sale_price
ORDER BY data_amount; 