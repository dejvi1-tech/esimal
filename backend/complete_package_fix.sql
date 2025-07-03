-- Complete fix for my_packages table and specific failing package
-- This script should be run in Supabase SQL editor

-- Step 1: Add features column to my_packages table if it doesn't exist
ALTER TABLE my_packages 
ADD COLUMN IF NOT EXISTS features JSONB;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_my_packages_features ON my_packages USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_my_packages_features_package_id ON my_packages USING GIN ((features->>'packageId'));

-- Step 3: Fix the specific failing package
UPDATE my_packages 
SET 
  features = '{
    "packageId": "esim-al-30days-1gb-all",
    "dataAmount": 1024,
    "days": 30,
    "price": 2.49,
    "currency": "EUR",
    "plan": "data-only",
    "activation": "first-use",
    "isUnlimited": false,
    "withSMS": false,
    "withCall": false,
    "withHotspot": true,
    "withDataRoaming": true,
    "geography": "local",
    "region": "Europe",
    "countrySlug": "al",
    "notes": []
  }'::jsonb,
  updated_at = NOW()
WHERE id = '5ecb7401-a4c8-4168-a295-0054ca092889';

-- Step 4: Verify the fix
SELECT 
  id,
  name,
  country_name,
  data_amount,
  days,
  features->>'packageId' as roamify_package_id,
  features->'dataAmount' as roamify_data_amount,
  updated_at
FROM my_packages 
WHERE id = '5ecb7401-a4c8-4168-a295-0054ca092889';

-- Optional: Check how many other packages need fixing
SELECT 
  COUNT(*) as packages_needing_fix
FROM my_packages 
WHERE features IS NULL OR features->>'packageId' IS NULL; 