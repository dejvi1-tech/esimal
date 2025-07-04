-- SIMPLE GUEST USER RLS FIX
-- Run this in Supabase SQL Editor if the previous migration didn't work completely

-- Temporarily disable RLS to ensure guest user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_orders DISABLE ROW LEVEL SECURITY;

-- Ensure guest user exists
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_orders ENABLE ROW LEVEL SECURITY;

-- Create simple service role policies
DROP POLICY IF EXISTS "Service role full access to users table" ON users;
DROP POLICY IF EXISTS "Service role full access to user_orders table" ON user_orders;

CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_user_orders" ON user_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON users TO service_role;
GRANT ALL ON user_orders TO service_role;

-- Test query
SELECT 'Guest user RLS fix applied' as status; 