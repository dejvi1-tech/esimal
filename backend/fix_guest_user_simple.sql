-- IMMEDIATE FIX FOR GUEST USER ISSUE
-- Run this in your Supabase SQL Editor to fix the problem right now

-- Step 1: Create guest user with different strategies (one will work)
-- Strategy 1: Try with all fields
INSERT INTO users (
  id, email, password, first_name, last_name, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'Guest',
  'User',
  'guest',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Strategy 2: If above fails, try minimal approach
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'guest'
) ON CONFLICT (id) DO NOTHING;

-- Strategy 3: If both above fail, try essential only
INSERT INTO users (id, email, password) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Verify guest user was created
SELECT 
  id, 
  email, 
  role, 
  created_at,
  'Guest user exists!' as status
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 3: Fix user_orders constraints (if table exists)
-- Drop existing constraint
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;

-- Add proper constraint that allows NULL and references users table
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Fix package_id constraint to point to my_packages
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Step 4: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_package_id ON user_orders(package_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);

-- Step 5: Final verification - this should return the guest user
SELECT 
  'SUCCESS: Guest user ready for orders' as result,
  id,
  email,
  role
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- If you see results above, the fix is complete! 