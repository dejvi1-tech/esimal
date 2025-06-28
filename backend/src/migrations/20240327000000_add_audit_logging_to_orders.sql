-- Add audit logging fields to orders table for email and eSIM delivery tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_error TEXT,
ADD COLUMN IF NOT EXISTS esim_delivered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS esim_delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS esim_error TEXT,
ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '{}';

-- Add indexes for audit fields
CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON orders(email_sent);
CREATE INDEX IF NOT EXISTS idx_orders_email_sent_at ON orders(email_sent_at);
CREATE INDEX IF NOT EXISTS idx_orders_esim_delivered ON orders(esim_delivered);
CREATE INDEX IF NOT EXISTS idx_orders_esim_delivered_at ON orders(esim_delivered_at);
CREATE INDEX IF NOT EXISTS idx_orders_audit_log ON orders USING GIN(audit_log);

-- Add comments for documentation
COMMENT ON COLUMN orders.email_sent IS 'Whether confirmation email was sent successfully';
COMMENT ON COLUMN orders.email_sent_at IS 'Timestamp when confirmation email was sent';
COMMENT ON COLUMN orders.email_error IS 'Error message if email sending failed';
COMMENT ON COLUMN orders.esim_delivered IS 'Whether eSIM was delivered successfully';
COMMENT ON COLUMN orders.esim_delivered_at IS 'Timestamp when eSIM was delivered';
COMMENT ON COLUMN orders.esim_error IS 'Error message if eSIM delivery failed';
COMMENT ON COLUMN orders.audit_log IS 'JSON object containing detailed audit trail'; 