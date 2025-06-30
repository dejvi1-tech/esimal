-- Add external_id column to packages table for human-readable string IDs
ALTER TABLE packages ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE; 