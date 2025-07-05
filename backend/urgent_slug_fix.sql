-- URGENT: Fix Missing Package Slugs for Webhook Delivery
-- This script fixes the specific package causing webhook failures and all other missing slugs

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

-- Step 3: Create function to generate proper slugs
CREATE OR REPLACE FUNCTION generate_package_slug(
  p_country_code TEXT,
  p_days INTEGER,
  p_data_amount NUMERIC
) RETURNS TEXT AS $$
BEGIN
  -- Handle null values with defaults
  IF p_country_code IS NULL OR p_country_code = '' THEN
    p_country_code := 'global';
  END IF;
  
  IF p_days IS NULL OR p_days <= 0 THEN
    p_days := 30;
  END IF;
  
  IF p_data_amount IS NULL OR p_data_amount <= 0 THEN
    p_data_amount := 1;
  END IF;
  
  -- Generate slug in format: esim-{country}-{days}days-{data}gb-all
  RETURN 'esim-' || LOWER(p_country_code) || '-' || 
         p_days || 'days-' || 
         FLOOR(p_data_amount) || 'gb-all';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Fix the specific failing package first
UPDATE my_packages 
SET 
  slug = generate_package_slug(country_code, days, data_amount),
  updated_at = NOW()
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c'
  AND (slug IS NULL OR slug = '');

-- Step 5: Fix all other packages with missing slugs
UPDATE my_packages 
SET 
  slug = generate_package_slug(country_code, days, data_amount),
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

-- Step 7: Show overall results
SELECT 
  'OVERALL RESULTS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as packages_with_slugs,
  ROUND(COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM my_packages;

-- Step 8: Show sample of fixed packages
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

-- Step 9: Check for any remaining issues
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

-- Step 10: Final verification message
SELECT 
  'FINAL STATUS' as info,
  CASE 
    WHEN (SELECT COUNT(*) FROM my_packages WHERE slug IS NULL OR slug = '') = 0 
    THEN '🎉 SUCCESS: All packages now have slugs - webhook deliveries should work!'
    ELSE '⚠️ WARNING: Some packages still missing slugs - may need manual review'
  END as message;

-- Step 11: Clean up function (optional)
-- DROP FUNCTION IF EXISTS generate_package_slug(TEXT, INTEGER, NUMERIC); 