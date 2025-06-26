const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCheckoutSessionColumn() {
  try {
    console.log('Adding stripe_checkout_session_id column to orders table...');
    
    // Test if the column already exists by trying to query it
    const { data, error } = await supabase
      .from('orders')
      .select('id, stripe_checkout_session_id')
      .limit(1);

    if (error && error.message.includes('stripe_checkout_session_id')) {
      console.log('❌ Column does not exist yet');
      console.log('');
      console.log('📋 Manual steps required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('');
      console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;');
      console.log('CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);');
      console.log('');
    } else {
      console.log('✅ stripe_checkout_session_id column already exists!');
      console.log('🎉 No action needed');
    }

  } catch (error) {
    console.error('Check failed:', error);
  }
}

addCheckoutSessionColumn(); 