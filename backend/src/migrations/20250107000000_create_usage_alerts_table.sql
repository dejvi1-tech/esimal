-- Create usage_alerts table
CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  iccid VARCHAR(20) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  data_limit DECIMAL(10,2) NOT NULL,
  data_used DECIMAL(10,2) NOT NULL,
  data_remaining DECIMAL(10,2) NOT NULL,
  usage_percentage DECIMAL(5,2) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('80_percent')),
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usage_alerts_order_id ON usage_alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_iccid ON usage_alerts(iccid);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_alert_type ON usage_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_created_at ON usage_alerts(created_at);

-- Create unique constraint to prevent duplicate alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_alerts_unique ON usage_alerts(order_id, alert_type);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_usage_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usage_alerts_updated_at
  BEFORE UPDATE ON usage_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_alerts_updated_at(); 