-- Fix package_id field type to accommodate slug-based package IDs
-- The original schema expected UUID but the actual data contains slugs

-- First, drop the foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'orders_package_id_fkey' 
               AND table_name = 'orders') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_package_id_fkey;
    END IF;
END $$;

-- Change the package_id column type from UUID to TEXT
ALTER TABLE orders ALTER COLUMN package_id TYPE TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN orders.package_id IS 'Package ID (slug) from my_packages table';

-- Create an index on package_id for better performance
CREATE INDEX IF NOT EXISTS idx_orders_package_id ON orders(package_id); 