-- Migration: Fix Country Labeling Issues
-- Problem: Packages with "Europe & United States eSIM Package" name have incorrect country_name values
-- Solution: Update country_name to match the package type
-- Date: 2025-07-03
-- Environment: Production

-- Step 1: Show packages that need fixing (for verification)
SELECT 
  id,
  name,
  country_name AS current_country,
  'Europe & United States' AS should_be_country,
  data_amount,
  days,
  sale_price,
  updated_at
FROM my_packages 
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States'
ORDER BY data_amount;

-- Step 2: Update all mismatched packages
UPDATE my_packages 
SET 
  country_name = 'Europe & United States',
  updated_at = NOW()
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States';

-- Step 3: Verify the fix - this should return 0 rows
SELECT 
  id,
  name,
  country_name,
  data_amount,
  sale_price
FROM my_packages 
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name != 'Europe & United States';

-- Step 4: Show all Europe & United States packages after fix
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  sale_price,
  COUNT(*) OVER() as total_europe_us_packages
FROM my_packages 
WHERE country_name = 'Europe & United States'
ORDER BY data_amount;

-- Step 5: Show summary statistics
SELECT 
  'Fixed Packages' as status,
  COUNT(*) as count
FROM my_packages 
WHERE name = 'Europe & United States eSIM Package' 
  AND country_name = 'Europe & United States'

UNION ALL

SELECT 
  'Total Europe & United States Packages' as status,
  COUNT(*) as count
FROM my_packages 
WHERE country_name = 'Europe & United States';

-- Additional check: Look for other potential country mismatches
SELECT 
  'Potential Issues' as check_type,
  COUNT(*) as count,
  'Packages with Europe/US in name but wrong country' as description
FROM my_packages 
WHERE (name ILIKE '%Europe%' OR name ILIKE '%United States%')
  AND country_name NOT IN ('Europe & United States', 'Germany', 'France', 'Italy', 'Spain')

UNION ALL

SELECT 
  'Dubai Check' as check_type,
  COUNT(*) as count,
  'Dubai packages with inconsistent naming' as description
FROM my_packages 
WHERE (name ILIKE '%Dubai%' OR name ILIKE '%UAE%' OR name ILIKE '%United Arab Emirates%')
  AND country_name != 'Dubai'; 