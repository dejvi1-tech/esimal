-- Create guest user and fix user_orders constraints
-- This fixes the foreign key constraint violation issue

-- 1. Insert guest user if it doesn't exist
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
  'guest',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Fix user_orders foreign key constraint
-- Drop existing constraint if it exists
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;

-- Recreate constraint with proper reference and allow null for guest orders
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Make sure user_id can be null for guest orders (optional)
-- ALTER TABLE user_orders ALTER COLUMN user_id DROP NOT NULL;

-- 4. Ensure package_id constraint points to the right table
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- 5. Add some helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_package_id ON user_orders(package_id);
CREATE INDEX IF NOT EXISTS idx_user_orders_status ON user_orders(status);

-- 6. Add comment for future reference
COMMENT ON TABLE user_orders IS 'User orders table with proper foreign key constraints to users and my_packages tables'; 