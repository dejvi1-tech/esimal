-- UNDO: Remove all country-specific packages from most-popular
-- Keep only the packages that should actually be in most-popular

-- Step 1: Remove all packages with country-specific location_slug from most-popular
-- These should NOT be in most-popular (they have location_slug like 'de', 'fr', 'al', etc.)
UPDATE my_packages 
SET 
  location_slug = CASE 
    -- Keep country-specific packages in their country sections
    WHEN location_slug IN ('de', 'fr', 'al', 'gr', 'it', 'es', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'ge', 'hu', 'is', 'ie', 'lv', 'xk', 'ba', 'ad') THEN location_slug
    -- Reset others that shouldn't be in most-popular
    WHEN location_slug != 'most-popular' THEN country_code
    ELSE location_slug
  END,
  homepage_order = 999,
  updated_at = NOW()
WHERE location_slug != 'most-popular' 
  AND data_amount > 0;

-- Step 2: Keep only intended packages in most-popular
-- Only these should be in most-popular section:
UPDATE my_packages 
SET 
  location_slug = 'most-popular',
  updated_at = NOW()
WHERE name IN (
  '1 GB - 30 days',
  '3 GB - 30 days', 
  '5 GB - 30 days',
  '10 GB - 30 days',
  '15 GB - 30 days',
  '20 GB - 30 days',
  '30 GB - 30 days',
  '50 GB - 30 days'
) 
AND country_code = 'EUUS'  -- Only the Europe & US packages
AND data_amount > 0;

-- Step 3: Keep unlimited packages in most-popular (these are correct)
UPDATE my_packages 
SET 
  location_slug = 'most-popular',
  homepage_order = CASE 
    WHEN name = 'Unlimited - 7 days' THEN 996
    WHEN name = 'Unlimited - 15 days' THEN 997  
    WHEN name = 'Unlimited - 30 days' THEN 998
    ELSE homepage_order
  END,
  updated_at = NOW()
WHERE data_amount = 0 
  AND country_code = 'EUUS';

-- Step 4: Set proper homepage_order for most-popular normal packages
UPDATE my_packages 
SET homepage_order = CASE 
  WHEN name = '1 GB - 30 days' AND location_slug = 'most-popular' THEN 1
  WHEN name = '3 GB - 30 days' AND location_slug = 'most-popular' THEN 2  
  WHEN name = '5 GB - 30 days' AND location_slug = 'most-popular' THEN 3
  WHEN name = '10 GB - 30 days' AND location_slug = 'most-popular' THEN 4
  WHEN name = '15 GB - 30 days' AND location_slug = 'most-popular' THEN 5
  WHEN name = '20 GB - 30 days' AND location_slug = 'most-popular' THEN 6
  WHEN name = '30 GB - 30 days' AND location_slug = 'most-popular' THEN 7
  WHEN name = '50 GB - 30 days' AND location_slug = 'most-popular' THEN 8
  ELSE homepage_order
END
WHERE location_slug = 'most-popular' 
  AND data_amount > 0 
  AND country_code = 'EUUS';

-- Step 5: Verify what's now in most-popular (should be much less)
SELECT 
  'VERIFICATION' as status,
  name,
  country_code,
  data_amount,
  days,
  homepage_order,
  location_slug
FROM my_packages 
WHERE location_slug = 'most-popular' 
  AND visible = true
ORDER BY homepage_order; 