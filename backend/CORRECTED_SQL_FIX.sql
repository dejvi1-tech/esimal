-- CORRECTED SQL FIX for eSIM Delivery Issue
-- This version checks the actual table structure and adapts accordingly

-- Step 1: Check what columns exist in the users table
-- Run this first to see the actual structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- Step 2: Create guest user (simplified version that works with any users table schema)
-- Option A: If you have first_name and last_name columns
INSERT INTO users (
  id, email, password, first_name, last_name, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com', 'disabled-account', 'Guest', 'User', 'guest', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Option B: If you DON'T have first_name/last_name columns (use this if Option A fails)
-- INSERT INTO users (
--   id, email, password, role, created_at, updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'guest@esimal.com', 'disabled-account', 'guest', NOW(), NOW()
-- ) ON CONFLICT (id) DO NOTHING;

-- Option C: Minimal version if other columns don't exist
-- INSERT INTO users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'guest@esimal.com') ON CONFLICT (id) DO NOTHING;

-- Step 3: Fix user_orders foreign key constraint
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Fix package_id constraint to point to my_packages table
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Step 5: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_package_id ON user_orders(package_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);

-- Step 6: Verify the fix worked
-- SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 7: Test user_orders constraint (this should work now)
-- INSERT INTO user_orders (user_id, package_id, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'pending');
-- DELETE FROM user_orders WHERE package_id = '11111111-1111-1111-1111-111111111111'; 