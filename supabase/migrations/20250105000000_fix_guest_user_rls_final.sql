-- FINAL FIX FOR GUEST USER RLS POLICY ISSUES
-- This migration ensures guest user can create user_orders entries

-- Step 1: Ensure guest user exists
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Add comprehensive service role policies
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow service role to manage guest users" ON users;
DROP POLICY IF EXISTS "Allow service role to insert guest users" ON users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;

-- Create single comprehensive policy for service role on users
CREATE POLICY "Service role full access to users table" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Fix user_orders table policies
-- Drop existing policies
DROP POLICY IF EXISTS "Allow service role full access to user_orders" ON user_orders;

-- Create comprehensive policy for service role on user_orders
CREATE POLICY "Service role full access to user_orders table" ON user_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 4: Ensure proper foreign key constraints
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Step 5: Grant explicit permissions to service role
GRANT ALL ON users TO service_role;
GRANT ALL ON user_orders TO service_role;

-- Step 6: Verify the fix
SELECT 
  '✅ Guest user ready for orders!' as status,
  id,
  email,
  role,
  "createdAt"
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000'; 