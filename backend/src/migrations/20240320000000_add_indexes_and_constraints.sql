-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_package_id ON orders(package_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_esim_code ON orders(esim_code);
CREATE INDEX IF NOT EXISTS idx_packages_country_code ON packages(country_code);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);

-- Add constraints for data integrity
ALTER TABLE users
  ADD CONSTRAINT users_email_unique UNIQUE (email),
  ADD CONSTRAINT users_stripe_customer_id_unique UNIQUE (stripe_customer_id),
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'activated', 'expired', 'cancelled', 'refunded')),
  ADD CONSTRAINT orders_amount_check CHECK (amount > 0),
  ADD CONSTRAINT orders_esim_code_unique UNIQUE (esim_code),
  ADD CONSTRAINT orders_user_or_guest_check CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

ALTER TABLE packages
  ADD CONSTRAINT packages_price_check CHECK (price > 0),
  ADD CONSTRAINT packages_validity_days_check CHECK (validity_days > 0),
  ADD CONSTRAINT packages_country_code_check CHECK (country_code ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT packages_data_amount_check CHECK (data_amount ~ '^(\d+GB|Unlimited)$');

-- Add new columns for password reset
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- Add foreign key constraints
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_package
    FOREIGN KEY (package_id)
    REFERENCES packages(id)
    ON DELETE RESTRICT;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 