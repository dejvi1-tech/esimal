-- Add Europe Sprint packages back to most-popular section
-- These were accidentally removed during the cleanup

-- Step 1: Add both Europe Sprint packages (EUS country_code) to most-popular
UPDATE my_packages 
SET 
  location_slug = 'most-popular',
  show_on_frontend = true,
  visible = true,
  homepage_order = CASE 
    WHEN data_amount = 1 AND days = 30 AND country_code = 'EUS' THEN 2  -- 1GB Europe Sprint goes second
    WHEN data_amount = 15 AND days = 30 AND country_code = 'EUS' THEN 6 -- 15GB Europe Sprint goes in middle
    ELSE homepage_order
  END,
  updated_at = NOW()
WHERE country_code = 'EUS' 
  AND data_amount IN (1, 15) 
  AND days = 30;

-- Step 2: Verify the Europe Sprint packages are added
SELECT 
  'EUROPE SPRINT PACKAGES' as status,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  sale_price,
  homepage_order,
  location_slug
FROM my_packages 
WHERE country_code = 'EUS' 
  AND location_slug = 'most-popular'
ORDER BY data_amount;

-- Step 3: Show the complete most-popular section order
SELECT 
  'COMPLETE MOST-POPULAR ORDER' as section,
  name,
  data_amount,
  days,
  homepage_order,
  CASE 
    WHEN data_amount = 0 THEN '🚀 UNLIMITED'
    WHEN country_code = 'EUS' THEN '⭐ EUROPE SPRINT'
    ELSE '📦 EUROPE & US'
  END as package_type
FROM my_packages 
WHERE location_slug = 'most-popular' 
  AND visible = true
  AND show_on_frontend = true
ORDER BY homepage_order; 