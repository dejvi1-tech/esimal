const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runAuditMigration() {
  try {
    console.log('Executing audit logging migration...');

    const sqlStatements = [
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_error TEXT;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_delivered BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_delivered_at TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_error TEXT;',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT \'{}\';',
      'CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON orders(email_sent);',
      'CREATE INDEX IF NOT EXISTS idx_orders_email_sent_at ON orders(email_sent_at);',
      'CREATE INDEX IF NOT EXISTS idx_orders_esim_delivered ON orders(esim_delivered);',
      'CREATE INDEX IF NOT EXISTS idx_orders_esim_delivered_at ON orders(esim_delivered_at);',
      'CREATE INDEX IF NOT EXISTS idx_orders_audit_log ON orders USING GIN(audit_log);'
    ];

    for (const sql of sqlStatements) {
      console.log('Executing:', sql);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error('Error executing SQL:', sql, error);
        // Continue with other statements even if one fails
      } else {
        console.log('Successfully executed:', sql);
      }
    }

    console.log('Audit logging migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runAuditMigration(); 