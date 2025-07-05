-- URGENT: Fix Missing Package Slugs for Webhook Delivery (Greece Format Corrected)
-- This script fixes the specific package causing webhook failures and all other missing slugs
-- Uses the correct Greece format: esim-greece-30days-1gb-all

-- Step 1: Check the current state of the failing package
SELECT 
  'FAILING PACKAGE STATUS' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN '❌ MISSING SLUG - CAUSING WEBHOOK FAILURE'
    ELSE '✅ HAS SLUG'
  END as status
FROM my_packages 
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c';

-- Step 2: Show all packages with missing slugs
SELECT 
  'PACKAGES WITH MISSING SLUGS' as info,
  COUNT(*) as total_missing_slugs
FROM my_packages 
WHERE slug IS NULL OR slug = '';

-- Step 3: Create function to generate proper slugs (Greece format corrected)
CREATE OR REPLACE FUNCTION generate_package_slug_greece_format(
  p_country_code TEXT,
  p_country_name TEXT,
  p_days INTEGER,
  p_data_amount NUMERIC
) RETURNS TEXT AS $$
DECLARE
  country_slug TEXT;
BEGIN
  -- Handle null values with defaults
  IF p_days IS NULL OR p_days <= 0 THEN
    p_days := 30;
  END IF;
  
  IF p_data_amount IS NULL OR p_data_amount <= 0 THEN
    p_data_amount := 1;
  END IF;
  
  -- Handle country-specific slug formats
  IF p_country_code = 'GR' OR LOWER(p_country_name) LIKE '%greece%' THEN
    country_slug := 'greece';
  ELSIF p_country_code = 'AL' OR LOWER(p_country_name) LIKE '%albania%' THEN
    country_slug := 'albania';
  ELSIF p_country_code = 'DE' OR LOWER(p_country_name) LIKE '%germany%' THEN
    country_slug := 'germany';
  ELSIF p_country_code = 'US' OR LOWER(p_country_name) LIKE '%united states%' THEN
    country_slug := 'usa';
  ELSIF p_country_code = 'GB' OR LOWER(p_country_name) LIKE '%united kingdom%' THEN
    country_slug := 'uk';
  ELSIF p_country_code = 'FR' OR LOWER(p_country_name) LIKE '%france%' THEN
    country_slug := 'france';
  ELSIF p_country_code = 'IT' OR LOWER(p_country_name) LIKE '%italy%' THEN
    country_slug := 'italy';
  ELSIF p_country_code = 'ES' OR LOWER(p_country_name) LIKE '%spain%' THEN
    country_slug := 'spain';
  ELSIF p_country_code IS NOT NULL AND p_country_code != '' THEN
    country_slug := LOWER(p_country_code);
  ELSE
    country_slug := 'global';
  END IF;
  
  -- Generate slug in format: esim-{country}-{days}days-{data}gb-all
  RETURN 'esim-' || country_slug || '-' || 
         p_days || 'days-' || 
         FLOOR(p_data_amount) || 'gb-all';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Fix the specific failing package first
UPDATE my_packages 
SET 
  slug = generate_package_slug_greece_format(country_code, country_name, days, data_amount),
  updated_at = NOW()
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c'
  AND (slug IS NULL OR slug = '');

-- Step 5: Fix all other packages with missing slugs
UPDATE my_packages 
SET 
  slug = generate_package_slug_greece_format(country_code, country_name, days, data_amount),
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND id != 'f6315d94-55d7-4402-9637-968cb54cb74c';

-- Step 6: Verify the fix for the specific failing package
SELECT 
  'SPECIFIC PACKAGE AFTER FIX' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ FIXED - WEBHOOK SHOULD WORK'
    ELSE '❌ STILL MISSING SLUG'
  END as status
FROM my_packages 
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c';

-- Step 7: Show Greece packages specifically
SELECT 
  'GREECE PACKAGES CHECK' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug LIKE 'esim-greece-%' THEN '✅ CORRECT GREECE FORMAT'
    WHEN slug LIKE 'esim-gr-%' THEN '⚠️ OLD FORMAT - MAY NEED UPDATE'
    WHEN slug IS NULL OR slug = '' THEN '❌ MISSING SLUG'
    ELSE '⚠️ UNEXPECTED FORMAT'
  END as status
FROM my_packages 
WHERE country_code = 'GR' OR LOWER(country_name) LIKE '%greece%'
ORDER BY name;

-- Step 8: Show overall results
SELECT 
  'OVERALL RESULTS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as packages_with_slugs,
  ROUND(COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM my_packages;

-- Step 9: Show sample of fixed packages
SELECT 
  'SAMPLE FIXED PACKAGES' as info,
  name,
  country_name,
  slug,
  updated_at
FROM my_packages 
WHERE slug IS NOT NULL AND slug != ''
ORDER BY updated_at DESC
LIMIT 10;

-- Step 10: Check for any remaining issues
SELECT 
  'REMAINING ISSUES' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  'NEEDS MANUAL REVIEW' as issue
FROM my_packages 
WHERE slug IS NULL OR slug = ''
ORDER BY country_name, name;

-- Step 11: Final verification message
SELECT 
  'FINAL STATUS' as info,
  CASE 
    WHEN (SELECT COUNT(*) FROM my_packages WHERE slug IS NULL OR slug = '') = 0 
    THEN '🎉 SUCCESS: All packages now have slugs - webhook deliveries should work!'
    ELSE '⚠️ WARNING: Some packages still missing slugs - may need manual review'
  END as message;

-- Step 12: Clean up function (optional)
-- DROP FUNCTION IF EXISTS generate_package_slug_greece_format(TEXT, TEXT, INTEGER, NUMERIC); 