-- Add region column to my_packages table
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS region text;

-- Create index for better performance on region filtering
CREATE INDEX IF NOT EXISTS idx_my_packages_region ON my_packages(region);

-- Update existing packages to have a default region if needed
UPDATE my_packages SET region = 'Unknown' WHERE region IS NULL; 