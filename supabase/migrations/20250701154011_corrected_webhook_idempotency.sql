-- CORRECTED Migration: Add webhook idempotency support and fix guest user RLS policies
-- This migration adapts to your actual table structure and doesn't assume column existence

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

-- Step 1: Create guest user with minimal fields that definitely exist
INSERT INTO users (
  id, 
  email, 
  password, 
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = COALESCE(EXCLUDED.updated_at, NOW());

-- Step 2: Conditionally add first_name and last_name if columns exist
DO $$
BEGIN
  -- Check if first_name column exists and update if it does
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    UPDATE users 
    SET first_name = 'Guest', last_name = 'User'
    WHERE id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE 'Updated guest user with first_name and last_name';
  ELSE
    RAISE NOTICE 'first_name column does not exist, skipping name update';
  END IF;
END $$;

-- Re-enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add specific policy to allow service role to insert/update guest users
CREATE POLICY "Allow service role to manage guest users" ON users
  FOR ALL
  TO service_role
  USING (id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Fix user_orders constraints to properly reference the tables (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Drop and recreate constraints
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
    ALTER TABLE user_orders 
    ADD CONSTRAINT user_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
    ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_package_id_fkey 
    FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'user_orders constraints updated successfully';
  ELSE
    RAISE NOTICE 'user_orders table not found, skipping constraint updates';
  END IF;
END $$;

-- Add RLS policies for user_orders table to allow service role access (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    CREATE POLICY "Allow service role full access to user_orders" ON user_orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'user_orders RLS policy created';
  END IF;
END $$;

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
  guest_email TEXT;
  guest_role TEXT;
BEGIN
  SELECT COUNT(*), email, role INTO guest_count, guest_email, guest_role
  FROM users 
  WHERE id = '00000000-0000-0000-0000-000000000000'
  GROUP BY email, role;
  
  IF guest_count = 1 THEN
    RAISE NOTICE '✅ Guest user successfully created/updated: email=%, role=%', guest_email, guest_role;
  ELSE
    RAISE EXCEPTION '❌ Failed to create guest user (count: %)', guest_count;
  END IF;
END $$;

-- Show final status
SELECT 
  '🎉 MIGRATION COMPLETE!' as status,
  'Guest user: ' || email as guest_info,
  'Role: ' || role as role_info,
  'Tables ready for webhook processing!' as result
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Add comments for documentation
COMMENT ON TABLE processed_events IS 'Stores webhook events to prevent duplicate processing and ensure idempotency';
COMMENT ON COLUMN processed_events.event_id IS 'Unique Stripe event ID from webhook';
COMMENT ON COLUMN processed_events.status IS 'Processing status: processing, completed, or failed';
COMMENT ON COLUMN processed_events.payload IS 'Complete webhook event payload for debugging'; 