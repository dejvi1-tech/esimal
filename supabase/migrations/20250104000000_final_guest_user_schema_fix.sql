-- DEFINITIVE GUEST USER SCHEMA FIX
-- This migration ensures the guest user can be created properly for eSIM delivery

-- Step 1: Verify and potentially fix the users table schema
-- The initial schema should have first_name and last_name, but let's ensure they exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Step 2: Temporarily disable RLS to ensure clean guest user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Insert/update the guest user with all required fields
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

-- Step 4: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create comprehensive service role policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role to manage guest users" ON users;
DROP POLICY IF EXISTS "Allow service role to insert guest users" ON users;

-- Create new comprehensive policy for service role
CREATE POLICY "Allow service role full access to users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Ensure processed_events table exists with proper policies
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
CREATE POLICY "Allow service role full access to processed_events" ON processed_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 7: Fix user_orders table constraints and policies
DO $$
BEGIN
  -- Only proceed if user_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Drop and recreate constraints
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
    ALTER TABLE user_orders ADD CONSTRAINT user_orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
    ALTER TABLE user_orders ADD CONSTRAINT user_orders_package_id_fkey 
      FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;
    
    -- Enable RLS and create service role policy
    ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow service role full access to user_orders" ON user_orders;
    CREATE POLICY "Allow service role full access to user_orders" ON user_orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'user_orders table configured successfully';
  ELSE
    RAISE NOTICE 'user_orders table does not exist, skipping configuration';
  END IF;
END $$;

-- Step 8: Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_status ON processed_events(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 9: Verification and status report
DO $$
DECLARE
  guest_user RECORD;
  events_count INTEGER;
BEGIN
  -- Check if guest user exists and get details
  SELECT * INTO guest_user FROM users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Guest user verified successfully:';
    RAISE NOTICE '   ID: %', guest_user.id;
    RAISE NOTICE '   Email: %', guest_user.email;
    RAISE NOTICE '   First Name: %', guest_user.first_name;
    RAISE NOTICE '   Last Name: %', guest_user.last_name;
    RAISE NOTICE '   Role: %', guest_user.role;
    RAISE NOTICE '   Created: %', guest_user.created_at;
  ELSE
    RAISE EXCEPTION '❌ Guest user verification failed';
  END IF;
  
  -- Check processed_events table
  SELECT COUNT(*) INTO events_count FROM processed_events;
  RAISE NOTICE '✅ Processed events table ready (current events: %)', events_count;
  
END $$;

-- Step 10: Final success confirmation
SELECT 
  '🎉 GUEST USER SCHEMA FIX COMPLETE!' as status,
  'Guest user: ' || email as guest_info,
  'Name: ' || COALESCE(first_name || ' ' || last_name, 'No name set') as name_info,
  'Role: ' || role as role_info,
  'Ready for webhook processing!' as result
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

COMMENT ON TABLE processed_events IS 'Webhook event tracking for idempotency';
COMMENT ON TABLE users IS 'Users table with guest user support for eSIM delivery'; 