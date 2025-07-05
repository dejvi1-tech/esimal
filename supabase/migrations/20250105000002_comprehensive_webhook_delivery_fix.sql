-- COMPREHENSIVE WEBHOOK DELIVERY FIX (CORRECTED)
-- This migration addresses all RLS policy issues preventing user_orders creation
-- and adapts to the actual table structure

-- Step 1: Ensure guest user exists with proper setup (adaptive approach)
DO $$
BEGIN
  -- First check what columns exist in the users table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    -- Table has created_at and updated_at columns
    INSERT INTO users (id, email, password, role, created_at, updated_at) 
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'guest@esimal.com',
      'disabled-account',
      'user',
      NOW(),
      NOW()
    ) 
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      updated_at = NOW();
  ELSE
    -- Table doesn't have timestamp columns, use minimal approach
    INSERT INTO users (id, email, password, role) 
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'guest@esimal.com',
      'disabled-account',
      'user'
    ) 
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role;
  END IF;
  
  -- Optionally add first_name and last_name if columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    UPDATE users 
    SET first_name = 'Guest', last_name = 'User'
    WHERE id = '00000000-0000-0000-0000-000000000000';
  END IF;
  
  RAISE NOTICE 'Guest user ensured in database';
END $$;

-- Step 2: Create comprehensive service role policies for users table
DO $$
BEGIN
  -- Drop existing conflicting policies
  DROP POLICY IF EXISTS "Allow service role to manage guest users" ON users;
  DROP POLICY IF EXISTS "Allow service role to insert guest users" ON users;
  DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
  DROP POLICY IF EXISTS "Service role full access to users table" ON users;
  DROP POLICY IF EXISTS "service_role_users" ON users;
  
  -- Create single comprehensive policy for service role
  CREATE POLICY "service_role_users_comprehensive" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  
  RAISE NOTICE 'Service role policies created for users table';
END $$;

-- Step 3: Fix user_orders table setup
DO $$
BEGIN
  -- Check if user_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Fix foreign key constraints
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
    ALTER TABLE user_orders 
    ADD CONSTRAINT user_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
    ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_package_id_fkey 
    FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;
    
    -- Enable RLS
    ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Allow service role full access to user_orders" ON user_orders;
    DROP POLICY IF EXISTS "Service role full access to user_orders table" ON user_orders;
    DROP POLICY IF EXISTS "service_role_user_orders" ON user_orders;
    
    -- Create comprehensive service role policy
    CREATE POLICY "service_role_user_orders_comprehensive" ON user_orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'user_orders table configured with proper RLS policies';
  ELSE
    RAISE NOTICE 'user_orders table does not exist - skipping configuration';
  END IF;
END $$;

-- Step 4: Grant explicit permissions to service role
GRANT ALL ON users TO service_role;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    GRANT ALL ON user_orders TO service_role;
    RAISE NOTICE 'Permissions granted to service role for user_orders';
  END IF;
END $$;

-- Step 5: Create processed_events table for webhook idempotency if it doesn't exist
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

-- Enable RLS and create policy for processed_events
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access to processed_events" ON processed_events;
CREATE POLICY "service_role_processed_events_comprehensive" ON processed_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON processed_events TO service_role;

-- Step 6: Create useful indexes
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_status ON processed_events(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_user_orders_user_id ON user_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_orders_package_id ON user_orders(package_id);
    CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);
    RAISE NOTICE 'Indexes created for user_orders table';
  END IF;
END $$;

-- Step 7: Final verification
DO $$
DECLARE
  guest_user RECORD;
  policies_count INTEGER;
  user_columns TEXT;
BEGIN
  -- Check guest user
  SELECT * INTO guest_user FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Guest user verified: email=%, role=%', guest_user.email, guest_user.role;
  ELSE
    RAISE EXCEPTION '❌ Guest user not found after migration';
  END IF;
  
  -- Check service role policies
  SELECT COUNT(*) INTO policies_count 
  FROM pg_policies 
  WHERE tablename = 'users' 
  AND roles = '{service_role}';
  
  IF policies_count > 0 THEN
    RAISE NOTICE '✅ Service role policies verified for users table (count: %)', policies_count;
  ELSE
    RAISE EXCEPTION '❌ No service role policies found for users table';
  END IF;
  
  -- Check user_orders policies if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    SELECT COUNT(*) INTO policies_count 
    FROM pg_policies 
    WHERE tablename = 'user_orders' 
    AND roles = '{service_role}';
    
    IF policies_count > 0 THEN
      RAISE NOTICE '✅ Service role policies verified for user_orders table (count: %)', policies_count;
    ELSE
      RAISE EXCEPTION '❌ No service role policies found for user_orders table';
    END IF;
  END IF;
  
  -- Show what columns exist in users table for debugging
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO user_columns
  FROM information_schema.columns 
  WHERE table_name = 'users';
  
  RAISE NOTICE 'ℹ️  Users table columns: %', user_columns;
END $$;

-- Step 8: Final success message
SELECT 
  '🎉 WEBHOOK DELIVERY FIX COMPLETE!' as status,
  'Guest user: ' || email as guest_info,
  'Role: ' || role as role_info,
  'System ready for webhook processing!' as result
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Add documentation
COMMENT ON TABLE processed_events IS 'Webhook event processing table with idempotency support';
COMMENT ON COLUMN users.id IS 'User ID - guest user uses 00000000-0000-0000-0000-000000000000'; 