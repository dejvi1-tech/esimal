-- ADAPTIVE FIX FOR GUEST USER ISSUE
-- This script checks your actual table structure and adapts accordingly

-- Step 1: First, let's see what columns actually exist in your users table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 2: Create guest user using ONLY columns that exist
-- Try minimal approach first (these columns should always exist)
INSERT INTO users (id, email, password) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account'
) ON CONFLICT (id) DO NOTHING;

-- Step 3: If your table has a role column, add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    UPDATE users SET role = 'guest' 
    WHERE id = '00000000-0000-0000-0000-000000000000';
  END IF;
END $$;

-- Step 4: If your table has first_name and last_name, add them
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    UPDATE users 
    SET first_name = 'Guest', last_name = 'User'
    WHERE id = '00000000-0000-0000-0000-000000000000';
  END IF;
END $$;

-- Step 5: Verify the guest user was created
SELECT 
  'SUCCESS: Guest user created!' as status,
  id,
  email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') 
    THEN (SELECT role FROM users WHERE id = '00000000-0000-0000-0000-000000000000')::text
    ELSE 'role column not found'
  END as role,
  created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 6: Fix user_orders constraints (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_orders') THEN
    -- Drop and recreate constraints
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
    ALTER TABLE user_orders 
    ADD CONSTRAINT user_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    
    -- Fix package constraint
    ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
    ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_package_id_fkey 
    FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'user_orders constraints fixed';
  ELSE
    RAISE NOTICE 'user_orders table not found, skipping constraint fixes';
  END IF;
END $$;

-- Step 7: Final verification
SELECT 
  '🎉 FIX COMPLETE!' as result,
  'Guest user ID: ' || id as guest_user,
  'Email: ' || email as guest_email,
  'Ready for orders!' as status
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000'; 