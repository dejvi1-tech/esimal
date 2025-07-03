-- Rename validity_days to days in packages
ALTER TABLE packages RENAME COLUMN validity_days TO days;
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_validity_days_check;
ALTER TABLE packages ADD CONSTRAINT packages_days_check CHECK (days > 0);

-- Rename validity_days to days in my_packages if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='my_packages' AND column_name='validity_days') THEN
    EXECUTE 'ALTER TABLE my_packages RENAME COLUMN validity_days TO days';
  END IF;
END $$;
-- Add constraint for my_packages.days
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='my_packages' AND column_name='days') THEN
    EXECUTE 'ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_validity_days_check';
    EXECUTE 'ALTER TABLE my_packages ADD CONSTRAINT my_packages_days_check CHECK (days > 0)';
  END IF;
END $$; 