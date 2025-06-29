ALTER TABLE packages
ADD COLUMN IF NOT EXISTS roamify_package_id text UNIQUE;

-- Optional: create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_packages_roamify_package_id ON packages(roamify_package_id); 