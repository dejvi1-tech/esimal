-- Add roamify_product_id column to packages table for storing Roamify product IDs
ALTER TABLE packages ADD COLUMN IF NOT EXISTS roamify_product_id TEXT; 