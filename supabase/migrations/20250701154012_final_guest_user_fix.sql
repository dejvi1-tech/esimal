-- FINAL GUEST USER FIX - Adapts to actual table schema
-- This migration works with your actual users table structure

-- Step 1: Create processed_events table for webhook idempotency (if not exists)
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

-- Enable RLS on processed_events
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for processed_events (allow service role full access)
CREATE POLICY "Allow service role full access to processed_events" ON processed_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 2: Create guest user with minimal required fields (no first_name/last_name)
-- Temporarily disable RLS to ensure guest user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert guest user with only required fields
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Re-enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add specific policy to allow service role to manage guest users
CREATE POLICY "Allow service role to manage guest users" ON users
  FOR ALL
  TO service_role
  USING (id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Step 3: Fix user_orders constraints (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Drop and recreate user_id constraint
    EXECUTE 'ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey';
    EXECUTE 'ALTER TABLE user_orders ADD CONSTRAINT user_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL';
    
    -- Drop and recreate package_id constraint  
    EXECUTE 'ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey';
    EXECUTE 'ALTER TABLE user_orders ADD CONSTRAINT user_orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE';
    
    RAISE NOTICE 'user_orders constraints updated successfully';
  ELSE
    RAISE NOTICE 'user_orders table not found - constraints not needed';
  END IF;
END $$;

-- Step 4: Add RLS policies for user_orders table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Enable RLS on user_orders
    EXECUTE 'ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY';
    
    -- Add policy to allow service role full access
    EXECUTE 'CREATE POLICY "Allow service role full access to user_orders" ON user_orders FOR ALL TO service_role USING (true) WITH CHECK (true)';
    
    RAISE NOTICE 'user_orders RLS policies added successfully';
  END IF;
END $$;

-- Step 5: Verify the guest user was created successfully
DO $$
DECLARE
  guest_count INTEGER;
  guest_user RECORD;
BEGIN
  -- Check if guest user exists
  SELECT COUNT(*) INTO guest_count FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  IF guest_count > 0 THEN
    -- Get guest user details
    SELECT * INTO guest_user FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE '✅ Guest user successfully created/updated: %', guest_user.email;
    RAISE NOTICE '   User ID: %', guest_user.id;
    RAISE NOTICE '   Role: %', guest_user.role;
    RAISE NOTICE '   Created: %', guest_user.created_at;
  ELSE
    RAISE NOTICE '❌ Failed to create guest user';
  END IF;
END $$;

-- Step 6: Final status report
SELECT 
  '🎉 MIGRATION COMPLETE!' as status,
  'Guest user: ' || email as guest_info,
  'Role: ' || role as role_info,
  'Tables ready for webhook processing!' as result
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000'; 