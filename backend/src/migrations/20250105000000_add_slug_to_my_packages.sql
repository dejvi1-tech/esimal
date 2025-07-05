-- Migration: Add slug column to my_packages table for Roamify V2 integration
-- This column will store the slug-style package IDs (e.g., "esim-greece-30days-3gb-all")

-- Step 1: Add slug column if it doesn't exist
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Create index for better performance on slug lookups
CREATE INDEX IF NOT EXISTS idx_my_packages_slug ON my_packages(slug);

-- Step 3: Create unique index to ensure no duplicate slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_my_packages_slug_unique ON my_packages(slug) WHERE slug IS NOT NULL;

-- Step 4: Add comment to document the column
COMMENT ON COLUMN my_packages.slug IS 'Slug-style package ID for Roamify V2 API (e.g., "esim-greece-30days-3gb-all")';

-- Step 5: Update existing packages to have slug values based on their features.packageId
-- This is a temporary fix until the sync process is updated
UPDATE my_packages 
SET slug = features->>'packageId'
WHERE slug IS NULL 
  AND features IS NOT NULL 
  AND features->>'packageId' IS NOT NULL;

-- Step 6: Create a function to generate slug from package data
CREATE OR REPLACE FUNCTION generate_package_slug(
  country_code TEXT,
  days INTEGER,
  data_amount NUMERIC,
  plan_type TEXT DEFAULT 'all'
) RETURNS TEXT AS $$
BEGIN
  RETURN 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || 
         COALESCE(days, 30) || 'days-' || 
         FLOOR(COALESCE(data_amount, 1)) || 'gb-' || 
         COALESCE(plan_type, 'all');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Update packages without slug to use generated slug
UPDATE my_packages 
SET slug = generate_package_slug(country_code, days, data_amount)
WHERE slug IS NULL 
  AND country_code IS NOT NULL;

-- Add slug column to my_packages table for webhook compatibility
-- This is needed for the Roamify eSIM delivery webhook to work properly

-- Create index for slug lookups (webhook performance)
CREATE INDEX IF NOT EXISTS idx_my_packages_slug ON my_packages(slug);

-- Create composite index for slug + visible packages (webhook optimization)
CREATE INDEX IF NOT EXISTS idx_my_packages_slug_visible ON my_packages(slug, visible) WHERE visible = true;

-- Add comment for documentation
COMMENT ON COLUMN my_packages.slug IS 'Greece-style slug for Roamify eSIM delivery (e.g., esim-greece-30days-1gb-all)';

-- Sample data to show the expected format
-- Example slugs: 
-- esim-greece-30days-1gb-all
-- esim-albania-30days-3gb-all
-- esim-germany-15days-5gb-all
-- esim-united-states-30days-20gb-all 