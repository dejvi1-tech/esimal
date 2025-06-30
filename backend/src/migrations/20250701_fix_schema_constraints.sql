-- 20250701_fix_schema_constraints.sql
-- Adds default UUID, NOT NULLs, ON DELETE CASCADE/SET NULL, and a CHECK constraint

-- 1. Add DEFAULT gen_random_uuid() to my_packages.id
ALTER TABLE my_packages
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Add NOT NULL constraints
ALTER TABLE user_orders
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN package_id SET NOT NULL;

ALTER TABLE my_packages
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN country_name SET NOT NULL,
    ALTER COLUMN data_amount SET NOT NULL;

ALTER TABLE orders
    ALTER COLUMN amount SET NOT NULL,
    ALTER COLUMN status SET NOT NULL;

-- 3. Add ON DELETE CASCADE/SET NULL to FKs
-- Drop and recreate constraints as needed

-- user_orders.user_id → users(id) ON DELETE CASCADE
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey;
ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE;

-- user_orders.package_id → my_packages(id) ON DELETE CASCADE
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey;
ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_package_id_fkey FOREIGN KEY (package_id)
    REFERENCES my_packages(id) ON DELETE CASCADE;

-- packages.created_by → users(id) ON DELETE SET NULL
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_created_by_fkey;
ALTER TABLE packages
    ADD CONSTRAINT packages_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL;

-- packages.updated_by → users(id) ON DELETE SET NULL
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_updated_by_fkey;
ALTER TABLE packages
    ADD CONSTRAINT packages_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES users(id) ON DELETE SET NULL;

-- 4. Add CHECK constraint to user_orders.status
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_status_check;
ALTER TABLE user_orders
    ADD CONSTRAINT user_orders_status_check CHECK (status IN ('pending', 'active', 'expired', 'cancelled')); 