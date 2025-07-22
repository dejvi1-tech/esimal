-- Fix the database function to properly handle unlimited packages
-- This ensures the SQL function generates correct slugs for unlimited packages

-- Drop and recreate the function with unlimited package support
DROP FUNCTION IF EXISTS generate_package_slug(TEXT, INTEGER, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION generate_package_slug(
  country_code TEXT,
  days INTEGER,
  data_amount NUMERIC,
  plan_type TEXT DEFAULT 'all'
) RETURNS TEXT AS $$
BEGIN
  -- Handle unlimited packages (data_amount = 0)
  IF data_amount = 0 THEN
    RETURN 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || 
           COALESCE(days, 30) || 'days-unlimited-' || 
           COALESCE(plan_type, 'all');
  ELSE
    -- Handle normal packages
    RETURN 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || 
           COALESCE(days, 30) || 'days-' || 
           FLOOR(COALESCE(data_amount, 1)) || 'gb-' || 
           COALESCE(plan_type, 'all');
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment to document the fix
COMMENT ON FUNCTION generate_package_slug IS 'Generates standardized package slugs with proper support for unlimited packages (data_amount = 0)';

-- Update existing packages with wrong slugs using the fixed function
-- This will fix any packages that were generated with the old function
UPDATE my_packages 
SET slug = generate_package_slug(country_code, days, data_amount)
WHERE slug IS NOT NULL 
  AND slug != generate_package_slug(country_code, days, data_amount)
  AND country_code IS NOT NULL;

-- Show how many packages were updated
-- Note: This is for informational purposes - it won't show in the script output
-- but helps with manual verification in SQL console
SELECT 
  'UPDATED' as status,
  country_code,
  data_amount,
  days,
  slug as new_slug,
  CASE 
    WHEN data_amount = 0 THEN 'UNLIMITED' 
    ELSE data_amount || 'GB' 
  END as data_display
FROM my_packages 
WHERE slug = generate_package_slug(country_code, days, data_amount)
  AND country_code IS NOT NULL
ORDER BY data_amount, country_code; 