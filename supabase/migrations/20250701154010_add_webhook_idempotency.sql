-- Migration: Add webhook idempotency support and fix guest user RLS policies
-- This migration creates the processed_events table for preventing duplicate webhook processing
-- and ensures the guest user can be created with proper RLS policies

-- Create processed_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_event_type ON processed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_processed_events_status ON processed_events(status);
CREATE INDEX IF NOT EXISTS idx_processed_events_created_at ON processed_events(created_at);

-- Enable RLS on processed_events
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for processed_events (allow service role full access)
CREATE POLICY "Allow service role full access to processed_events" ON processed_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create the guest user with proper RLS handling
-- First, temporarily disable RLS for users table to ensure guest user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert guest user with all required fields
INSERT INTO users (
  id, 
  email, 
  password, 
  first_name, 
  last_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'Guest',
  'User',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Re-enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add specific policy to allow service role to insert/update guest users
CREATE POLICY "Allow service role to manage guest users" ON users
  FOR ALL
  TO service_role
  USING (id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Fix user_orders constraints to properly reference the tables
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Add RLS policies for user_orders table to allow service role access
CREATE POLICY "Allow service role full access to user_orders" ON user_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add cleanup function for old processed events (optional)
CREATE OR REPLACE FUNCTION cleanup_old_processed_events()
RETURNS void AS $$
BEGIN
  -- Delete processed events older than 30 days
  DELETE FROM processed_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Verify the guest user was created successfully
DO $$
DECLARE
  guest_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO guest_count 
  FROM users 
  WHERE id = '00000000-0000-0000-0000-000000000000';
  
  IF guest_count = 1 THEN
    RAISE NOTICE '✅ Guest user successfully created/updated';
  ELSE
    RAISE EXCEPTION '❌ Failed to create guest user';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE processed_events IS 'Stores webhook events to prevent duplicate processing and ensure idempotency';
COMMENT ON COLUMN processed_events.event_id IS 'Unique Stripe event ID from webhook';
COMMENT ON COLUMN processed_events.status IS 'Processing status: processing, completed, or failed';
COMMENT ON COLUMN processed_events.payload IS 'Complete webhook event payload for debugging'; 