-- Fix my_packages table UUID consistency
-- This script will ensure all records have proper UUIDs and correct frontend visibility settings

-- First, let's check the current state
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN id IS NOT NULL AND id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids,
  COUNT(CASE WHEN id IS NOT NULL AND id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN 1 END) as non_uuid_ids
FROM my_packages;

-- Store the old IDs in a temporary table for reference
CREATE TEMPORARY TABLE my_packages_old_ids AS
SELECT 
  id as old_id,
  name,
  country_name,
  reseller_id,
  created_at
FROM my_packages 
WHERE id IS NOT NULL 
  AND id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Display records that will be updated
SELECT 
  'WILL UPDATE:' as action,
  old_id,
  name,
  country_name,
  reseller_id
FROM my_packages_old_ids
ORDER BY created_at
LIMIT 10;

-- Update records with NULL ids (if any exist)
UPDATE my_packages 
SET id = gen_random_uuid()
WHERE id IS NULL;

-- For non-UUID string IDs, we have two options:
-- Option 1: Replace with new UUIDs (RECOMMENDED for clean data)
-- Option 2: Keep the existing string IDs if they're working fine

-- OPTION 1: Replace non-UUID IDs with proper UUIDs
-- This is the safest approach for long-term data consistency

-- Add a temporary column to store the old ID as a reference
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS old_string_id text;

-- First, backup the old string IDs
UPDATE my_packages 
SET old_string_id = id
WHERE id IS NOT NULL 
  AND id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND old_string_id IS NULL;

-- Now update the non-UUID IDs with proper UUIDs
UPDATE my_packages 
SET id = gen_random_uuid()
WHERE id IS NOT NULL 
  AND id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Ensure all frontend packages have correct visibility settings
UPDATE my_packages 
SET 
  visible = true,
  show_on_frontend = true
WHERE visible = true 
  AND country_code IS NOT NULL
  AND (show_on_frontend IS NULL OR show_on_frontend = false);

-- Ensure packages marked for frontend are also visible
UPDATE my_packages 
SET visible = true
WHERE show_on_frontend = true 
  AND (visible IS NULL OR visible = false);

-- Fix any missing country codes for well-known countries
UPDATE my_packages 
SET country_code = 'AL'
WHERE country_name = 'Albania' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'DE'
WHERE country_name = 'Germany' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'EU'
WHERE country_name = 'Europe & United States' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'US'
WHERE country_name = 'United States' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'FR'
WHERE country_name = 'France' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'IT'
WHERE country_name = 'Italy' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'ES'
WHERE country_name = 'Spain' AND country_code IS NULL;

UPDATE my_packages 
SET country_code = 'GB'
WHERE country_name = 'United Kingdom' AND country_code IS NULL;

-- Final verification
SELECT 
  'AFTER FIX:' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids,
  COUNT(CASE WHEN visible = true THEN 1 END) as visible_packages,
  COUNT(CASE WHEN show_on_frontend = true THEN 1 END) as frontend_packages,
  COUNT(CASE WHEN visible = true AND show_on_frontend = true AND country_code IS NOT NULL THEN 1 END) as ready_for_frontend
FROM my_packages;

-- Show sample of updated records
SELECT 
  'SAMPLE UPDATED RECORDS:' as info,
  id,
  old_string_id,
  name,
  country_name,
  country_code,
  visible,
  show_on_frontend
FROM my_packages 
WHERE old_string_id IS NOT NULL
ORDER BY created_at
LIMIT 5;

-- Optional: Clean up the temporary column after verification
-- ALTER TABLE my_packages DROP COLUMN IF EXISTS old_string_id;

COMMIT; 