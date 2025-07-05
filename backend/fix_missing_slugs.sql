-- Fix Missing Slugs in my_packages table
-- This script automatically detects and fixes missing slugs to prevent eSIM delivery failures

-- Step 1: Show current status
SELECT 
  'CURRENT STATUS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as have_slugs,
  ROUND(COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_percent
FROM my_packages;

-- Step 2: Show packages with missing slugs
SELECT 
  'PACKAGES WITH MISSING SLUGS' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  features->>'packageId' as features_package_id
FROM my_packages 
WHERE slug IS NULL OR slug = ''
ORDER BY country_name, name;

-- Step 3: Create a function to generate slug from package data
CREATE OR REPLACE FUNCTION generate_package_slug(
  country_code TEXT,
  days INTEGER,
  data_amount NUMERIC,
  plan_type TEXT DEFAULT 'all'
) RETURNS TEXT AS $$
BEGIN
  -- Handle null values with defaults
  IF country_code IS NULL OR country_code = '' THEN
    country_code := 'global';
  END IF;
  
  IF days IS NULL OR days <= 0 THEN
    days := 30;
  END IF;
  
  IF data_amount IS NULL OR data_amount <= 0 THEN
    data_amount := 1;
  END IF;
  
  -- Convert data amount to GB if it's in MB (assuming > 1000 means MB)
  IF data_amount > 1000 THEN
    data_amount := FLOOR(data_amount / 1024);
  END IF;
  
  RETURN 'esim-' || LOWER(country_code) || '-' || 
         days || 'days-' || 
         FLOOR(data_amount) || 'gb-' || 
         plan_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Update packages with missing slugs using features.packageId first
UPDATE my_packages 
SET 
  slug = features->>'packageId',
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND features IS NOT NULL 
  AND features->>'packageId' IS NOT NULL
  AND features->>'packageId' != '';

-- Step 5: Update remaining packages with missing slugs using generated slugs
UPDATE my_packages 
SET 
  slug = generate_package_slug(country_code, days, data_amount),
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND country_code IS NOT NULL;

-- Step 6: Show results after fix
SELECT 
  'AFTER FIX STATUS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as have_slugs,
  ROUND(COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_percent
FROM my_packages;

-- Step 7: Show sample updated packages
SELECT 
  'SAMPLE UPDATED PACKAGES' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  updated_at
FROM my_packages 
WHERE slug IS NOT NULL AND slug != ''
ORDER BY updated_at DESC
LIMIT 10;

-- Step 8: Test Greece packages specifically
SELECT 
  'GREECE PACKAGES TEST' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ READY FOR WEBHOOK'
    ELSE '❌ MISSING SLUG - WILL CAUSE WEBHOOK FAILURE'
  END as webhook_status
FROM my_packages 
WHERE country_name ILIKE '%greece%' OR country_code = 'GR'
ORDER BY name;

-- Step 9: Show any remaining packages with missing slugs (if any)
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

-- Step 10: Final summary
SELECT 
  'FINAL SUMMARY' as info,
  CASE 
    WHEN COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) = 0 THEN '🎉 SUCCESS: All packages have slugs!'
    ELSE '⚠️ WARNING: Some packages still missing slugs'
  END as status,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) as packages_with_slugs,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as packages_without_slugs
FROM my_packages;

-- Step 11: Clean up - drop the function (optional)
-- DROP FUNCTION IF EXISTS generate_package_slug(TEXT, INTEGER, NUMERIC, TEXT); 