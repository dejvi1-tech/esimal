-- SIMPLE GUEST USER FIX - Run this in Supabase SQL Editor
-- This creates the guest user with only the columns that exist

-- Step 1: Create guest user with minimal fields
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 2: Add RLS policy for service role
CREATE POLICY IF NOT EXISTS "Allow service role to manage guest users" ON users
  FOR ALL
  TO service_role
  USING (id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Step 3: Verify guest user was created
SELECT 
  '✅ Guest user ready!' as status,
  id,
  email,
  role,
  created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';
