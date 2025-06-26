-- Add fields for most popular packages feature
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS location_slug text;
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS show_on_frontend boolean DEFAULT false;
ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS homepage_order integer DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_my_packages_location_slug ON my_packages(location_slug);
CREATE INDEX IF NOT EXISTS idx_my_packages_show_on_frontend ON my_packages(show_on_frontend);
CREATE INDEX IF NOT EXISTS idx_my_packages_homepage_order ON my_packages(homepage_order);

-- Create composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_my_packages_frontend_display ON my_packages(location_slug, show_on_frontend, homepage_order); 