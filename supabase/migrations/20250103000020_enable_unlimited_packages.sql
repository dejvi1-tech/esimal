-- Migration: Enable unlimited packages support
-- This migration removes constraints that block unlimited packages (data_amount = 0, days = 0)
-- Date: 2025-01-03

-- Step 1: Fix packages table constraints
-- Drop existing constraint that blocks unlimited packages
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_data_amount_check;

-- Add new constraint that allows unlimited (0 values) and Unlimited text
ALTER TABLE packages ADD CONSTRAINT packages_data_amount_check 
  CHECK (data_amount ~ '^(\d+GB|\d+MB|Unlimited)$' OR (data_amount IS NOT NULL));

-- Allow days = 0 for unlimited duration packages  
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_days_check;
ALTER TABLE packages ADD CONSTRAINT packages_days_check CHECK (days >= 0);

-- Step 2: Fix my_packages table constraints  
-- Allow unlimited data (data_amount = 0)
ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_data_amount_check;
-- Note: No new constraint needed for my_packages.data_amount since it's numeric

-- Allow unlimited duration (days = 0) - remove the > 0 constraint
ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_days_check;
ALTER TABLE my_packages ADD CONSTRAINT my_packages_days_check CHECK (days >= 0);

-- Step 3: Update any existing NULL values to prevent constraint violations
UPDATE packages SET days = 30 WHERE days IS NULL OR days < 0;
UPDATE my_packages SET days = 30 WHERE days IS NULL OR days < 0;

-- Step 4: Add helpful comments
COMMENT ON COLUMN packages.data_amount IS 'Data amount as string (e.g., "5GB", "Unlimited") or numeric for storage';
COMMENT ON COLUMN packages.days IS 'Package validity in days (0 = unlimited duration)';
COMMENT ON COLUMN my_packages.data_amount IS 'Data amount in GB (0 = unlimited data)';
COMMENT ON COLUMN my_packages.days IS 'Package validity in days (0 = unlimited duration)';

-- Step 5: Create sample unlimited packages for testing
-- Note: This is optional and can be removed if not needed
INSERT INTO my_packages (
  id,
  name,
  country_name,
  country_code,
  data_amount,
  days,
  base_price,
  sale_price,
  profit,
  reseller_id,
  region,
  visible,
  show_on_frontend,
  location_slug,
  homepage_order,
  slug,
  features,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Unlimited Europe 7 Days',
  'Europe',
  'EU',
  0, -- unlimited data
  7,
  19.99,
  23.99,
  4.00,
  null,
  'Europe',
  true,
  true,
  'europe-unlimited',
  1,
  'esim-eu-7days-unlimited-all',
  jsonb_build_object(
    'packageId', 'esim-eu-7days-unlimited-all',
    'dataAmount', 0,
    'days', 7,
    'price', 19.99,
    'currency', 'EUR',
    'plan', 'data-only',
    'activation', 'first-use',
    'isUnlimited', true,
    'withSMS', false,
    'withCall', false,
    'withHotspot', true,
    'withDataRoaming', true,
    'geography', 'regional',
    'region', 'Europe',
    'countrySlug', 'europe',
    'notes', '[]'::jsonb
  ),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create index for better performance on unlimited packages
CREATE INDEX IF NOT EXISTS idx_my_packages_unlimited 
ON my_packages(data_amount) 
WHERE data_amount = 0;

-- Step 7: Verification query
SELECT 
  'VERIFICATION: Unlimited packages support enabled' as status,
  COUNT(*) as total_unlimited_packages
FROM my_packages 
WHERE data_amount = 0 
  AND features->>'isUnlimited' = 'true'; 