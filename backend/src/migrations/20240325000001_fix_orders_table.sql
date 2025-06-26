-- Fix orders table to ensure it has all required columns for eSIM functionality
-- Add missing columns if they don't exist

-- Add esim_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'esim_code') THEN
        ALTER TABLE orders ADD COLUMN esim_code VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Add qr_code_data column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'qr_code_data') THEN
        ALTER TABLE orders ADD COLUMN qr_code_data TEXT;
    END IF;
END $$;

-- Add user_email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_email') THEN
        ALTER TABLE orders ADD COLUMN user_email VARCHAR(255);
    END IF;
END $$;

-- Add user_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_name') THEN
        ALTER TABLE orders ADD COLUMN user_name VARCHAR(255);
    END IF;
END $$;

-- Add data_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'data_amount') THEN
        ALTER TABLE orders ADD COLUMN data_amount INTEGER;
    END IF;
END $$;

-- Add validity_days column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'validity_days') THEN
        ALTER TABLE orders ADD COLUMN validity_days INTEGER;
    END IF;
END $$;

-- Add country_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'country_name') THEN
        ALTER TABLE orders ADD COLUMN country_name VARCHAR(255);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_esim_code ON orders(esim_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at); 