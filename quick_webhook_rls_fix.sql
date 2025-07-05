-- QUICK WEBHOOK RLS FIX (CORRECTED FOR ACTUAL TABLE STRUCTURE)
-- Run this directly in Supabase SQL Editor to fix webhook delivery issues

-- Step 1: Create guest user (minimal approach that works with any users table)
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Step 2: Conditionally add name fields (check for different column name formats)
DO $$
BEGIN
  -- Try camelCase columns first (firstName, lastName)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'firstName'
  ) THEN
    UPDATE users 
    SET 
      "firstName" = COALESCE("firstName", 'Guest'),
      "lastName" = COALESCE("lastName", 'User')
    WHERE id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE 'Updated guest user with firstName and lastName (camelCase)';
  
  -- Try snake_case columns (first_name, last_name)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    UPDATE users 
    SET 
      first_name = COALESCE(first_name, 'Guest'),
      last_name = COALESCE(last_name, 'User')
    WHERE id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE 'Updated guest user with first_name and last_name (snake_case)';
  ELSE
    RAISE NOTICE 'No name columns found - guest user created with email and role only';
  END IF;
END $$;

-- Step 3: Drop any existing conflicting service role policies
DROP POLICY IF EXISTS "Allow service role to manage guest users" ON users;
DROP POLICY IF EXISTS "Allow service role to insert guest users" ON users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
DROP POLICY IF EXISTS "Service role full access to users table" ON users;
DROP POLICY IF EXISTS "service_role_users" ON users;

-- Step 4: Create comprehensive service role policy for users
CREATE POLICY "service_role_users_comprehensive" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Grant permissions to service role
GRANT ALL ON users TO service_role;

-- Step 6: Fix user_orders table if it exists
DO $$
BEGIN
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
    
    -- Enable RLS and drop existing policies
    ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow service role full access to user_orders" ON user_orders;
    DROP POLICY IF EXISTS "Service role full access to user_orders table" ON user_orders;
    DROP POLICY IF EXISTS "service_role_user_orders" ON user_orders;
    
    -- Create comprehensive service role policy
    CREATE POLICY "service_role_user_orders_comprehensive" ON user_orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    -- Grant permissions
    GRANT ALL ON user_orders TO service_role;
    
    RAISE NOTICE '✅ user_orders table configured successfully';
  ELSE
    RAISE NOTICE 'ℹ️  user_orders table does not exist - skipping configuration';
  END IF;
END $$;

-- Step 7: Create processed_events table for webhook idempotency
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

GRANT ALL ON processed_events TO service_role;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_status ON processed_events(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 9: Final verification and status
DO $$
DECLARE
  guest_user RECORD;
  user_policies INTEGER;
  user_orders_policies INTEGER;
  user_columns TEXT;
BEGIN
  -- Check guest user
  SELECT * INTO guest_user FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Guest user verified: % (Role: %)', guest_user.email, guest_user.role;
  ELSE
    RAISE EXCEPTION '❌ Guest user not found after creation';
  END IF;
  
  -- Check policies
  SELECT COUNT(*) INTO user_policies 
  FROM pg_policies 
  WHERE tablename = 'users' AND roles = '{service_role}';
  
  RAISE NOTICE '✅ Service role policies for users: %', user_policies;
  
  -- Check user_orders policies if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    SELECT COUNT(*) INTO user_orders_policies 
    FROM pg_policies 
    WHERE tablename = 'user_orders' AND roles = '{service_role}';
    
    RAISE NOTICE '✅ Service role policies for user_orders: %', user_orders_policies;
  END IF;
  
  -- Show table structure for debugging
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO user_columns
  FROM information_schema.columns 
  WHERE table_name = 'users';
  
  RAISE NOTICE 'ℹ️  Users table columns: %', user_columns;
END $$;

-- Step 10: Success message
SELECT 
  '🎉 WEBHOOK RLS FIX COMPLETE!' as status,
  'Guest user: ' || email as guest_info,
  'Role: ' || role as role_info
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Instructions for next steps
SELECT '📝 NEXT STEPS:' as instruction, 
       '1. Deploy updated webhook controller code' as step_1,
       '2. Test with: node backend/test_webhook_delivery_fix.js' as step_2,
       '3. Monitor webhook logs for success' as step_3; 