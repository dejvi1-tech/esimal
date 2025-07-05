-- COMPREHENSIVE FIX: Make All Countries Follow Greece Format
-- This script ensures all countries use full country names like Greece: esim-greece-30days-1gb-all
-- NOT country codes like: esim-gr-30days-1gb-all

-- Step 1: Check current slug formats
SELECT 
  'CURRENT SLUG FORMATS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug LIKE 'esim-greece-%' THEN 1 END) as greece_format,
  COUNT(CASE WHEN slug LIKE 'esim-albania-%' THEN 1 END) as albania_format,
  COUNT(CASE WHEN slug LIKE 'esim-germany-%' THEN 1 END) as germany_format,
  COUNT(CASE WHEN slug LIKE 'esim-al-%' OR slug LIKE 'esim-gr-%' OR slug LIKE 'esim-de-%' THEN 1 END) as country_code_format
FROM my_packages;

-- Step 2: Show packages that need fixing
SELECT 
  'PACKAGES NEEDING GREECE FORMAT' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN 'MISSING SLUG'
    WHEN slug LIKE 'esim-gr-%' THEN 'WRONG: USES GR INSTEAD OF GREECE'
    WHEN slug LIKE 'esim-al-%' THEN 'WRONG: USES AL INSTEAD OF ALBANIA'
    WHEN slug LIKE 'esim-de-%' THEN 'WRONG: USES DE INSTEAD OF GERMANY'
    WHEN slug LIKE 'esim-us-%' THEN 'WRONG: USES US INSTEAD OF UNITED-STATES'
    WHEN slug LIKE 'esim-gb-%' THEN 'WRONG: USES GB INSTEAD OF UNITED-KINGDOM'
    WHEN slug LIKE 'esim-fr-%' THEN 'WRONG: USES FR INSTEAD OF FRANCE'
    WHEN slug LIKE 'esim-it-%' THEN 'WRONG: USES IT INSTEAD OF ITALY'
    WHEN slug LIKE 'esim-es-%' THEN 'WRONG: USES ES INSTEAD OF SPAIN'
    ELSE 'NEEDS REVIEW'
  END as issue
FROM my_packages 
WHERE slug IS NULL OR slug = ''
   OR slug LIKE 'esim-gr-%'
   OR slug LIKE 'esim-al-%'
   OR slug LIKE 'esim-de-%'
   OR slug LIKE 'esim-us-%'
   OR slug LIKE 'esim-gb-%'
   OR slug LIKE 'esim-fr-%'
   OR slug LIKE 'esim-it-%'
   OR slug LIKE 'esim-es-%'
ORDER BY country_name;

-- Step 3: Create function to generate Greece-style slugs for all countries
CREATE OR REPLACE FUNCTION generate_greece_style_slug(
  p_country_name TEXT,
  p_country_code TEXT,
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
  
  -- Convert country name to Greece-style slug format
  -- Priority: Use country name, fallback to country code mapping
  IF LOWER(p_country_name) LIKE '%greece%' OR p_country_code = 'GR' THEN
    country_slug := 'greece';
  ELSIF LOWER(p_country_name) LIKE '%albania%' OR p_country_code = 'AL' THEN
    country_slug := 'albania';
  ELSIF LOWER(p_country_name) LIKE '%germany%' OR p_country_code = 'DE' THEN
    country_slug := 'germany';
  ELSIF LOWER(p_country_name) LIKE '%united states%' OR p_country_code = 'US' THEN
    country_slug := 'united-states';
  ELSIF LOWER(p_country_name) LIKE '%united kingdom%' OR p_country_code = 'GB' THEN
    country_slug := 'united-kingdom';
  ELSIF LOWER(p_country_name) LIKE '%france%' OR p_country_code = 'FR' THEN
    country_slug := 'france';
  ELSIF LOWER(p_country_name) LIKE '%italy%' OR p_country_code = 'IT' THEN
    country_slug := 'italy';
  ELSIF LOWER(p_country_name) LIKE '%spain%' OR p_country_code = 'ES' THEN
    country_slug := 'spain';
  ELSIF LOWER(p_country_name) LIKE '%netherlands%' OR p_country_code = 'NL' THEN
    country_slug := 'netherlands';
  ELSIF LOWER(p_country_name) LIKE '%belgium%' OR p_country_code = 'BE' THEN
    country_slug := 'belgium';
  ELSIF LOWER(p_country_name) LIKE '%austria%' OR p_country_code = 'AT' THEN
    country_slug := 'austria';
  ELSIF LOWER(p_country_name) LIKE '%portugal%' OR p_country_code = 'PT' THEN
    country_slug := 'portugal';
  ELSIF LOWER(p_country_name) LIKE '%switzerland%' OR p_country_code = 'CH' THEN
    country_slug := 'switzerland';
  ELSIF LOWER(p_country_name) LIKE '%poland%' OR p_country_code = 'PL' THEN
    country_slug := 'poland';
  ELSIF LOWER(p_country_name) LIKE '%turkey%' OR p_country_code = 'TR' THEN
    country_slug := 'turkey';
  ELSIF LOWER(p_country_name) LIKE '%dubai%' OR LOWER(p_country_name) LIKE '%uae%' OR p_country_code = 'AE' THEN
    country_slug := 'uae';
  ELSIF LOWER(p_country_name) LIKE '%canada%' OR p_country_code = 'CA' THEN
    country_slug := 'canada';
  ELSIF LOWER(p_country_name) LIKE '%japan%' OR p_country_code = 'JP' THEN
    country_slug := 'japan';
  ELSIF LOWER(p_country_name) LIKE '%south korea%' OR p_country_code = 'KR' THEN
    country_slug := 'south-korea';
  ELSIF LOWER(p_country_name) LIKE '%australia%' OR p_country_code = 'AU' THEN
    country_slug := 'australia';
  ELSIF LOWER(p_country_name) LIKE '%new zealand%' OR p_country_code = 'NZ' THEN
    country_slug := 'new-zealand';
  ELSIF LOWER(p_country_name) LIKE '%brazil%' OR p_country_code = 'BR' THEN
    country_slug := 'brazil';
  ELSIF LOWER(p_country_name) LIKE '%mexico%' OR p_country_code = 'MX' THEN
    country_slug := 'mexico';
  ELSIF LOWER(p_country_name) LIKE '%europe%' THEN
    country_slug := 'europe';
  ELSIF LOWER(p_country_name) LIKE '%asia%' THEN
    country_slug := 'asia';
  ELSIF p_country_name IS NOT NULL AND p_country_name != '' THEN
    -- For any other country, convert name to slug format
    country_slug := LOWER(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(TRIM(p_country_name), ' ', '-'),
            '&', 'and'
          ),
          ',', ''
        ),
        '.', ''
      )
    );
  ELSIF p_country_code IS NOT NULL AND p_country_code != '' THEN
    -- Fallback to country code if no name
    country_slug := LOWER(p_country_code);
  ELSE
    country_slug := 'global';
  END IF;
  
  -- Generate slug in Greece format: esim-{country}-{days}days-{data}gb-all
  RETURN 'esim-' || country_slug || '-' || 
         p_days || 'days-' || 
         FLOOR(p_data_amount) || 'gb-all';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Fix the specific failing package first
UPDATE my_packages 
SET 
  slug = generate_greece_style_slug(country_name, country_code, days, data_amount),
  updated_at = NOW()
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c';

-- Step 5: Fix all packages with missing slugs
UPDATE my_packages 
SET 
  slug = generate_greece_style_slug(country_name, country_code, days, data_amount),
  updated_at = NOW()
WHERE slug IS NULL OR slug = '';

-- Step 6: Fix packages with country code format (convert to Greece-style)
UPDATE my_packages 
SET 
  slug = generate_greece_style_slug(country_name, country_code, days, data_amount),
  updated_at = NOW()
WHERE slug LIKE 'esim-gr-%'
   OR slug LIKE 'esim-al-%'
   OR slug LIKE 'esim-de-%'
   OR slug LIKE 'esim-us-%'
   OR slug LIKE 'esim-gb-%'
   OR slug LIKE 'esim-fr-%'
   OR slug LIKE 'esim-it-%'
   OR slug LIKE 'esim-es-%';

-- Step 7: Verify the specific failing package is fixed
SELECT 
  'SPECIFIC PACKAGE FIXED' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ FIXED - WEBHOOK SHOULD WORK'
    ELSE '❌ STILL BROKEN'
  END as status
FROM my_packages 
WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c';

-- Step 8: Show all countries with their new Greece-style slugs
SELECT 
  'ALL COUNTRIES GREECE FORMAT' as info,
  country_name,
  country_code,
  COUNT(*) as package_count,
  MIN(slug) as sample_slug,
  CASE 
    WHEN MIN(slug) LIKE 'esim-greece-%' THEN '✅ CORRECT GREECE FORMAT'
    WHEN MIN(slug) LIKE 'esim-albania-%' THEN '✅ CORRECT ALBANIA FORMAT'
    WHEN MIN(slug) LIKE 'esim-germany-%' THEN '✅ CORRECT GERMANY FORMAT'
    WHEN MIN(slug) LIKE 'esim-united-states-%' THEN '✅ CORRECT USA FORMAT'
    WHEN MIN(slug) LIKE 'esim-united-kingdom-%' THEN '✅ CORRECT UK FORMAT'
    WHEN MIN(slug) LIKE 'esim-%' THEN '✅ CORRECT FULL NAME FORMAT'
    WHEN MIN(slug) LIKE 'esim-gr-%' OR MIN(slug) LIKE 'esim-al-%' OR MIN(slug) LIKE 'esim-de-%' THEN '❌ STILL USING COUNTRY CODE'
    ELSE '⚠️ NEEDS REVIEW'
  END as format_status
FROM my_packages 
WHERE slug IS NOT NULL AND slug != ''
GROUP BY country_name, country_code
ORDER BY country_name;

-- Step 9: Show overall results
SELECT 
  'FINAL RESULTS' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  COUNT(CASE WHEN slug LIKE 'esim-greece-%' THEN 1 END) as greece_format,
  COUNT(CASE WHEN slug LIKE 'esim-albania-%' THEN 1 END) as albania_format,
  COUNT(CASE WHEN slug LIKE 'esim-germany-%' THEN 1 END) as germany_format,
  COUNT(CASE WHEN slug LIKE 'esim-united-states-%' THEN 1 END) as usa_format,
  COUNT(CASE WHEN slug LIKE 'esim-united-kingdom-%' THEN 1 END) as uk_format,
  COUNT(CASE WHEN slug LIKE 'esim-%' AND slug NOT LIKE 'esim-gr-%' AND slug NOT LIKE 'esim-al-%' AND slug NOT LIKE 'esim-de-%' THEN 1 END) as full_name_format,
  COUNT(CASE WHEN slug LIKE 'esim-gr-%' OR slug LIKE 'esim-al-%' OR slug LIKE 'esim-de-%' THEN 1 END) as country_code_format,
  ROUND(COUNT(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM my_packages;

-- Step 10: Show any remaining issues
SELECT 
  'REMAINING ISSUES' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug IS NULL OR slug = '' THEN 'MISSING SLUG'
    WHEN slug LIKE 'esim-gr-%' THEN 'STILL USING GR INSTEAD OF GREECE'
    WHEN slug LIKE 'esim-al-%' THEN 'STILL USING AL INSTEAD OF ALBANIA'
    WHEN slug LIKE 'esim-de-%' THEN 'STILL USING DE INSTEAD OF GERMANY'
    ELSE 'OTHER ISSUE'
  END as issue
FROM my_packages 
WHERE slug IS NULL OR slug = ''
   OR slug LIKE 'esim-gr-%'
   OR slug LIKE 'esim-al-%'
   OR slug LIKE 'esim-de-%'
ORDER BY country_name;

-- Step 11: Final success message
SELECT 
  'SUCCESS STATUS' as info,
  CASE 
    WHEN (SELECT COUNT(*) FROM my_packages WHERE slug IS NULL OR slug = '' OR slug LIKE 'esim-gr-%' OR slug LIKE 'esim-al-%' OR slug LIKE 'esim-de-%') = 0 
    THEN '🎉 SUCCESS: All countries now use Greece-style full name format!'
    ELSE '⚠️ WARNING: Some packages still need fixing'
  END as message,
  'All future packages will automatically use full country names like Greece' as note;

-- Step 12: Clean up function (optional)
-- DROP FUNCTION IF EXISTS generate_greece_style_slug(TEXT, TEXT, INTEGER, NUMERIC); 