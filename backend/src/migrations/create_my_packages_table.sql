CREATE TABLE my_packages (
  id uuid PRIMARY KEY,
  name text,
  country_name text,
  data_amount numeric,
  validity_days integer,
  base_price numeric,
  sale_price numeric,
  profit numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create index for better performance
CREATE INDEX idx_my_packages_visible ON my_packages(created_at); 