-- Add price_cents column to packages table for storing price in cents
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0; 