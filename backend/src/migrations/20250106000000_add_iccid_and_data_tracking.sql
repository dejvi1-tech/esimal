-- Add ICCID and data usage tracking fields to orders table
-- This migration adds fields needed for eSIM ICCID tracking and data usage

-- Add iccid column to store the actual eSIM ICCID number
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'iccid') THEN
        ALTER TABLE orders ADD COLUMN iccid VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- Add data_used column to track actual data consumption
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'data_used') THEN
        ALTER TABLE orders ADD COLUMN data_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add qr_code_url column to store QR code URL
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'qr_code_url') THEN
        ALTER TABLE orders ADD COLUMN qr_code_url TEXT;
    END IF;
END $$;

-- Add last_usage_check column to track when usage was last updated
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'last_usage_check') THEN
        ALTER TABLE orders ADD COLUMN last_usage_check TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_iccid ON orders(iccid);
CREATE INDEX IF NOT EXISTS idx_orders_data_used ON orders(data_used);
CREATE INDEX IF NOT EXISTS idx_orders_qr_code_url ON orders(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_orders_last_usage_check ON orders(last_usage_check);

-- Add comments for documentation
COMMENT ON COLUMN orders.iccid IS 'eSIM ICCID number (starts with 89...) for usage tracking';
COMMENT ON COLUMN orders.data_used IS 'Actual data consumption in MB/GB';
COMMENT ON COLUMN orders.qr_code_url IS 'URL to QR code image for eSIM activation';
COMMENT ON COLUMN orders.last_usage_check IS 'Timestamp when usage data was last fetched from provider'; 