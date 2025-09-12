-- Add service role policies for orders table
-- This ensures backend operations continue to work with RLS enabled

-- Step 1: Add service role policy for orders table
DROP POLICY IF EXISTS "service_role_orders_comprehensive" ON orders;
CREATE POLICY "service_role_orders_comprehensive" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 2: Grant explicit permissions to service role
GRANT ALL ON orders TO service_role;

-- Step 3: Add policy for guest user orders (orders with guest_email)
DROP POLICY IF EXISTS "Allow guest user order access" ON orders;
CREATE POLICY "Allow guest user order access" ON orders
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (guest_email IS NOT NULL AND guest_email = auth.jwt() ->> 'email')
  );

-- Step 4: Add policy for creating guest orders
DROP POLICY IF EXISTS "Allow guest order creation" ON orders;
CREATE POLICY "Allow guest order creation" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (guest_email IS NOT NULL)
  );

-- Step 5: Verify the setup
SELECT 
  '✅ Orders table RLS policies configured!' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'orders'; 