-- Upsert each package with correct country, data, validity, price, and Roamify ID
INSERT INTO packages (id, country_code, data_amount, validity_days, price_cents, roamify_product_id)
VALUES
  ('esim-europe-us-30days-3gb-all', 'AL', 3072, 30, 649, 'roamify_prod_abcdef123'),
  ('esim-germany-1gb-7days', 'DE',   1024, 7,  499, 'roamify_prod_ghijkl456')
ON CONFLICT (id) DO UPDATE SET
  country_code = EXCLUDED.country_code,
  data_amount   = EXCLUDED.data_amount,
  validity_days = EXCLUDED.validity_days,
  price_cents   = EXCLUDED.price_cents,
  roamify_product_id = EXCLUDED.roamify_product_id;

-- Add more rows above as needed, one per package. 