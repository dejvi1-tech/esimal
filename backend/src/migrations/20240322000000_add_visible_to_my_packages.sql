-- Add visible column to my_packages table
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;

-- Add reseller_id column if it doesn't exist
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS reseller_id text;

-- Create index for better performance on visible packages
CREATE INDEX IF NOT EXISTS idx_my_packages_visible ON my_packages(visible);

-- Create index for reseller_id lookups
CREATE INDEX IF NOT EXISTS idx_my_packages_reseller_id ON my_packages(reseller_id); 