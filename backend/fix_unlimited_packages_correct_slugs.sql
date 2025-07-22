-- Fix unlimited packages with EXACT Roamify package IDs
-- Based on actual Roamify API response showing correct package IDs

-- Update unlimited packages with correct Roamify slugs
UPDATE my_packages 
SET 
  slug = CASE 
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 1 THEN 'esim-europe-us-1days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 3 THEN 'esim-europe-us-3days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 5 THEN 'esim-europe-us-5days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 7 THEN 'esim-europe-us-7days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 10 THEN 'esim-europe-us-10days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 15 THEN 'esim-europe-us-15days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 20 THEN 'esim-europe-us-20days-ungb-all'
    WHEN data_amount = 0 AND country_code = 'EUUS' AND days = 30 THEN 'esim-europe-us-30days-ungb-all'
    ELSE slug
  END,
  location_slug = CASE WHEN data_amount = 0 THEN 'most-popular' ELSE location_slug END,
  homepage_order = CASE WHEN data_amount = 0 THEN 998 ELSE homepage_order END,
  visible = true,
  show_on_frontend = true,
  updated_at = NOW()
WHERE data_amount = 0;

-- Also update the features.packageId to match the slug
UPDATE my_packages 
SET features = jsonb_set(
  COALESCE(features, '{}'),
  '{packageId}',
  to_jsonb(slug)
)
WHERE data_amount = 0 AND slug LIKE 'esim-europe-us-%days-ungb-all';

-- Update the database function to generate correct unlimited slugs
DROP FUNCTION IF EXISTS generate_package_slug(TEXT, INTEGER, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION generate_package_slug(
  country_code TEXT,
  days INTEGER,
  data_amount NUMERIC,
  plan_type TEXT DEFAULT 'all'
) RETURNS TEXT AS $$
BEGIN
  -- Handle unlimited packages with EXACT Roamify format
  IF data_amount = 0 THEN
    -- Europe & United States unlimited packages
    IF UPPER(country_code) IN ('EUUS', 'EUS') THEN
      RETURN 'esim-europe-us-' || COALESCE(days, 30) || 'days-ungb-all';
    ELSE
      -- Fallback for other unlimited packages
      RETURN 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || 
             COALESCE(days, 30) || 'days-ungb-all';
    END IF;
  ELSE
    -- Handle normal packages (existing logic)
    RETURN 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || 
           COALESCE(days, 30) || 'days-' || 
           FLOOR(COALESCE(data_amount, 1)) || 'gb-' || 
           COALESCE(plan_type, 'all');
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verify the updates
SELECT 
  name,
  country_code,
  data_amount,
  days,
  slug,
  location_slug,
  homepage_order,
  features->>'packageId' as features_package_id
FROM my_packages 
WHERE data_amount = 0
ORDER BY days;

-- Show what the function generates for unlimited packages
SELECT 
  '7 days EUUS' as test_case,
  generate_package_slug('EUUS', 7, 0) as generated_slug,
  'esim-europe-us-7days-ungb-all' as expected_slug,
  CASE WHEN generate_package_slug('EUUS', 7, 0) = 'esim-europe-us-7days-ungb-all' 
       THEN '✅ CORRECT' 
       ELSE '❌ WRONG' 
  END as status; 