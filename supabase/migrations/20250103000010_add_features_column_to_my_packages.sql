-- Add features column to my_packages table
-- This column will store Roamify package configuration as JSONB

ALTER TABLE my_packages 
ADD COLUMN IF NOT EXISTS features JSONB;

-- Create index for better performance on features queries
CREATE INDEX IF NOT EXISTS idx_my_packages_features ON my_packages USING GIN (features);

-- Create index specifically for packageId lookups
CREATE INDEX IF NOT EXISTS idx_my_packages_features_package_id ON my_packages USING GIN ((features->>'packageId'));

-- Add comment to document the column
COMMENT ON COLUMN my_packages.features IS 'JSONB column storing Roamify package configuration including packageId, dataAmount, etc.'; 