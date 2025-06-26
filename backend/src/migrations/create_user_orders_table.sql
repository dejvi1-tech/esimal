CREATE TABLE user_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  package_id uuid REFERENCES my_packages(id),
  roamify_order_id text,
  qr_code_url text,
  iccid text,
  status text DEFAULT 'pending',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_orders_user_id ON user_orders(user_id);
CREATE INDEX idx_user_orders_package_id ON user_orders(package_id);
CREATE INDEX idx_user_orders_status ON user_orders(status); 