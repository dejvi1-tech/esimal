-- Fix orders table schema - Add missing columns
-- This migration fixes the critical database schema issues

-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS roamify_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_code TEXT;

-- Update package_id column type if it exists as UUID
-- First check if package_id column exists and its type
DO $$
BEGIN
    -- Check if package_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'package_id'
    ) THEN
        -- Check if it's UUID type and convert to TEXT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'package_id' 
            AND data_type = 'uuid'
        ) THEN
            ALTER TABLE orders ALTER COLUMN package_id TYPE TEXT;
        END IF;
    ELSE
        -- Add package_id column if it doesn't exist
        ALTER TABLE orders ADD COLUMN package_id TEXT;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_roamify_order_id ON orders(roamify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_package_id ON orders(package_id);
CREATE INDEX IF NOT EXISTS idx_orders_esim_code ON orders(esim_code);

-- Add comments for documentation
COMMENT ON COLUMN orders.name IS 'Customer name for the order';
COMMENT ON COLUMN orders.roamify_order_id IS 'Order ID from Roamify API';
COMMENT ON COLUMN orders.package_id IS 'Package ID (can be slug or Roamify packageId)';
COMMENT ON COLUMN orders.esim_code IS 'eSIM activation code from Roamify'; 