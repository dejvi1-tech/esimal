-- Add metadata column to public.orders if missing to match backend expectations
-- This avoids "Could not find the 'metadata' column of 'orders' in the schema cache" errors

begin;

alter table public.orders
  add column if not exists metadata jsonb;

commit;