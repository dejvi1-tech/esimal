-- Add country_code column to my_packages table
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS country_code text;

-- Create index for better performance on country_code lookups
CREATE INDEX IF NOT EXISTS idx_my_packages_country_code ON my_packages(country_code);

-- Create composite index for country searches (both name and code)
CREATE INDEX IF NOT EXISTS idx_my_packages_country_search ON my_packages(country_name, country_code); 