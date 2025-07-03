-- Add features column to my_packages table
-- This column will store Roamify package configuration as JSONB
-- Migration: 20250103000010_add_features_column_to_my_packages.sql

-- Step 1: Add features column if it doesn't exist
ALTER TABLE my_packages 
ADD COLUMN IF NOT EXISTS features JSONB;

-- Step 2: Create indexes for better performance on features queries
CREATE INDEX IF NOT EXISTS idx_my_packages_features ON my_packages USING GIN (features);

-- Step 3: Create index specifically for packageId lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_my_packages_features_package_id ON my_packages ((features->>'packageId'));

-- Step 4: Add comment to document the column
COMMENT ON COLUMN my_packages.features IS 'JSONB column storing Roamify package configuration including packageId, dataAmount, days, price, currency, plan, activation settings, etc. This is required for eSIM delivery.';

-- Step 5: Update any existing packages without features to have auto-generated features
-- This ensures existing packages work with eSIM delivery
UPDATE my_packages 
SET 
  features = jsonb_build_object(
    'packageId', 'esim-' || LOWER(COALESCE(country_code, 'global')) || '-' || COALESCE(days, 30) || 'days-' || FLOOR(COALESCE(data_amount, 1)) || 'gb-all',
    'dataAmount', COALESCE(data_amount, 1),
    'days', COALESCE(days, 30),
    'price', COALESCE(base_price, 5.0),
    'currency', 'EUR',
    'plan', 'data-only',
    'activation', 'first-use',
    'isUnlimited', false,
    'withSMS', false,
    'withCall', false,
    'withHotspot', true,
    'withDataRoaming', true,
    'geography', 'local',
    'region', COALESCE(region, 'Europe'),
    'countrySlug', LOWER(COALESCE(country_code, 'global')),
    'notes', '[]'::jsonb
  ),
  updated_at = NOW()
WHERE features IS NULL OR features->>'packageId' IS NULL; 