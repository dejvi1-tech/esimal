-- Fix UUID slugs and convert to proper Roamify format
-- This script specifically targets packages that have UUID slugs instead of proper format

-- Step 1: Show current problematic slugs
SELECT 
  'CURRENT UUID SLUGS' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN '❌ UUID SLUG - NEEDS FIX'
    WHEN slug IS NULL OR slug = '' THEN '❌ MISSING SLUG'
    ELSE '✅ PROPER SLUG'
  END as slug_status
FROM my_packages 
WHERE slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   OR slug IS NULL 
   OR slug = '';

-- Step 2: Create improved slug generation function
CREATE OR REPLACE FUNCTION generate_roamify_slug(
  country_code TEXT,
  days INTEGER,
  data_amount NUMERIC,
  plan_type TEXT DEFAULT 'all'
) RETURNS TEXT AS $$
DECLARE
  clean_country TEXT;
  clean_data NUMERIC;
  clean_days INTEGER;
BEGIN
  -- Handle null values with defaults
  IF country_code IS NULL OR country_code = '' THEN
    clean_country := 'global';
  ELSE
    clean_country := LOWER(TRIM(country_code));
  END IF;
  
  IF days IS NULL OR days <= 0 THEN
    clean_days := 30;
  ELSE
    clean_days := days;
  END IF;
  
  IF data_amount IS NULL OR data_amount <= 0 THEN
    clean_data := 1;
  ELSE
    clean_data := data_amount;
  END IF;
  
  -- Convert data amount to GB if it's in MB (assuming > 1000 means MB)
  IF clean_data > 1000 THEN
    clean_data := FLOOR(clean_data / 1024);
  END IF;
  
  -- Ensure data is at least 1
  IF clean_data < 1 THEN
    clean_data := 1;
  END IF;
  
  RETURN 'esim-' || clean_country || '-' || 
         clean_days || 'days-' || 
         FLOOR(clean_data) || 'gb-' || 
         plan_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Fix UUID slugs by converting them to proper format
UPDATE my_packages 
SET 
  slug = generate_roamify_slug(country_code, days, data_amount),
  updated_at = NOW()
WHERE slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND country_code IS NOT NULL;

-- Step 4: Fix any remaining missing slugs
UPDATE my_packages 
SET 
  slug = generate_roamify_slug(country_code, days, data_amount),
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND country_code IS NOT NULL;

-- Step 5: Show results after fix
SELECT 
  'AFTER FIX - ALL PACKAGES' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug ~ '^esim-' THEN '✅ PROPER ROAMIFY SLUG'
    WHEN slug IS NULL OR slug = '' THEN '❌ STILL MISSING'
    ELSE '⚠️ UNEXPECTED FORMAT'
  END as slug_status
FROM my_packages 
ORDER BY country_name, name;

-- Step 6: Test Greece package specifically
SELECT 
  'GREECE PACKAGE TEST' as info,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  slug,
  CASE 
    WHEN slug ~ '^esim-gr-' OR slug ~ '^esim-greece-' THEN '✅ READY FOR WEBHOOK'
    WHEN slug IS NULL OR slug = '' THEN '❌ MISSING SLUG'
    WHEN slug ~ '^[0-9a-f]{8}-' THEN '❌ STILL UUID'
    ELSE '⚠️ UNEXPECTED FORMAT'
  END as webhook_status
FROM my_packages 
WHERE country_name ILIKE '%greece%' OR country_code = 'GR';

-- Step 7: Final verification
SELECT 
  'FINAL VERIFICATION' as info,
  COUNT(*) as total_packages,
  COUNT(CASE WHEN slug ~ '^esim-' THEN 1 END) as proper_slugs,
  COUNT(CASE WHEN slug ~ '^[0-9a-f]{8}-' THEN 1 END) as uuid_slugs,
  COUNT(CASE WHEN slug IS NULL OR slug = '' THEN 1 END) as missing_slugs,
  CASE 
    WHEN COUNT(CASE WHEN slug ~ '^esim-' THEN 1 END) = COUNT(*) THEN '🎉 SUCCESS: All packages have proper Roamify slugs!'
    ELSE '⚠️ WARNING: Some packages still need fixing'
  END as status
FROM my_packages;

-- Step 8: Show expected webhook payload for Greece package
SELECT 
  'EXPECTED WEBHOOK PAYLOAD FOR GREECE' as info,
  'Greece package slug: ' || slug as package_info,
  '[ROAMIFY V2 DEBUG] Request Payload: { items: [ { packageId: "' || slug || '", quantity: 1 } ] }' as expected_payload
FROM my_packages 
WHERE country_name ILIKE '%greece%' OR country_code = 'GR'
LIMIT 1; 