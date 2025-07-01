-- SIMPLE WORKING FIX FOR GUEST USER ISSUE
-- This avoids complex PL/pgSQL blocks that might cause issues in the SQL editor

-- Step 1: Create guest user with basic required fields
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Try to update with first_name and last_name (ignore if columns don't exist)
UPDATE users 
SET first_name = 'Guest', last_name = 'User'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 3: Verify the guest user was created
SELECT 
  'SUCCESS: Guest user created!' as status,
  id,
  email,
  role
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 4: Fix user_orders constraints (run these one by one if needed)
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;

ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;

ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Step 5: Final confirmation
SELECT 
  '🎉 FIX COMPLETE!' as result,
  'Guest user ready for orders!' as status,
  id as user_id,
  email,
  role
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000'; 