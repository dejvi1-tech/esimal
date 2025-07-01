-- Fix guest user issue for production database
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Fix constraints
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders ADD CONSTRAINT user_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders ADD CONSTRAINT user_orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE;

-- Verify fix
SELECT 'Guest user created successfully!' as status, id, email, role FROM users WHERE id = '00000000-0000-0000-0000-000000000000'; 