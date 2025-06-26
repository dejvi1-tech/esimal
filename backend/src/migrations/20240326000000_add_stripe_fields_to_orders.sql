-- Add Stripe-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_refund_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_customer_id ON orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_refund_id ON orders(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_failed_at ON orders(failed_at);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at ON orders(refunded_at);

-- Add unique constraint on stripe_payment_intent_id to prevent duplicates
ALTER TABLE orders 
ADD CONSTRAINT orders_stripe_payment_intent_id_unique UNIQUE (stripe_payment_intent_id); 