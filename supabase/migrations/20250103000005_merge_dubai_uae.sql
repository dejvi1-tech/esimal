-- Migration: Merge Dubai and United Arab Emirates into Dubai
-- This consolidates any packages using either country name

-- Step 1: Show current state
SELECT 
    'BEFORE MERGE' as status,
    country_name,
    country_code,
    COUNT(*) as package_count
FROM my_packages 
WHERE country_name ILIKE '%dubai%' 
   OR country_name ILIKE '%united arab emirates%'
   OR country_name ILIKE '%uae%'
   OR country_code = 'AE'
GROUP BY country_name, country_code
ORDER BY country_name;

-- Step 2: Update all variations to standardize on "Dubai"
UPDATE my_packages 
SET 
    country_name = 'Dubai',
    country_code = 'AE'
WHERE country_name ILIKE '%united arab emirates%'
   OR country_name ILIKE '%uae%'
   OR (country_code = 'AE' AND country_name != 'Dubai');

-- Step 3: Also update packages table if it exists
UPDATE packages 
SET 
    country_name = 'Dubai',
    country_code = 'AE'
WHERE country_name ILIKE '%united arab emirates%'
   OR country_name ILIKE '%uae%'
   OR (country_code = 'AE' AND country_name != 'Dubai');

-- Step 4: Show results after merge
SELECT 
    'AFTER MERGE' as status,
    country_name,
    country_code,
    COUNT(*) as package_count
FROM my_packages 
WHERE country_name ILIKE '%dubai%' 
   OR country_code = 'AE'
GROUP BY country_name, country_code
ORDER BY country_name;

-- Step 5: Update bundle data references (if any exist in database)
UPDATE my_packages 
SET location_slug = 'dubai'
WHERE country_code = 'AE' AND location_slug != 'dubai';

-- Step 6: Final verification
SELECT 
    'FINAL STATUS' as check_type,
    COUNT(*) as total_dubai_packages,
    COUNT(CASE WHEN visible = true THEN 1 END) as visible_packages,
    COUNT(CASE WHEN show_on_frontend = true THEN 1 END) as frontend_packages
FROM my_packages 
WHERE country_code = 'AE' AND country_name = 'Dubai';

SELECT 'SUCCESS: Dubai and UAE packages merged successfully!' as result; 