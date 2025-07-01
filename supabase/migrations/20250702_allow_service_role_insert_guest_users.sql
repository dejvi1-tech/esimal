-- Migration: Allow service_role to insert guest users into users table
CREATE POLICY "Allow service role to insert guest users"
  ON users
  FOR INSERT
  TO service_role
  USING (true)
  WITH CHECK (true); 