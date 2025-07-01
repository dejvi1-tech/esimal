-- Fix guest user issue for eSIM delivery
-- This migration creates the required guest user and fixes foreign key constraints

-- Create guest user with ID that the webhook controller expects
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Fix user_orders foreign key constraints
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders 
ADD CONSTRAINT user_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Fix package_id constraint to reference my_packages table  
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
ADD CONSTRAINT user_orders_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;
