-- Update Europe Sprint package to most-popular location_slug
-- This script updates the Europe Sprint package (country_code: EUS) to appear in the most popular section

-- First, show the current state of Europe Sprint packages
SELECT 
  'CURRENT STATE' as status,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  sale_price,
  location_slug,
  show_on_frontend,
  visible
FROM my_packages 
WHERE country_code = 'EUS'
ORDER BY data_amount;

-- Update Europe Sprint packages to most-popular
UPDATE my_packages 
SET 
  location_slug = 'most-popular',
  show_on_frontend = true,
  visible = true,
  updated_at = NOW()
WHERE country_code = 'EUS';

-- Verify the update
SELECT 
  'AFTER UPDATE' as status,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  sale_price,
  location_slug,
  show_on_frontend,
  visible
FROM my_packages 
WHERE country_code = 'EUS'
ORDER BY data_amount;

-- Show all packages in most-popular section
SELECT 
  'MOST POPULAR PACKAGES' as section,
  COUNT(*) as total_packages
FROM my_packages 
WHERE location_slug = 'most-popular'
  AND visible = true
  AND show_on_frontend = true;

-- List all most-popular packages
SELECT 
  name,
  country_name,
  country_code,
  data_amount,
  days,
  sale_price,
  location_slug
FROM my_packages 
WHERE location_slug = 'most-popular'
  AND visible = true
  AND show_on_frontend = true
ORDER BY data_amount; 