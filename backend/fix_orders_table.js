const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOrdersTable() {
  console.log('🔧 Fixing orders table schema...');
  
  try {
    // Check if esim_code column exists
    console.log('🔍 Checking current orders table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Error checking orders table:', columnsError);
      return;
    }
    
    console.log('✅ Orders table exists');
    
    // Try to insert a test record with esim_code to see if the column exists
    console.log('🧪 Testing esim_code column...');
    const testOrder = {
      package_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      amount: 0.01,
      status: 'pending',
      esim_code: 'TEST-CODE-1234',
      user_email: 'test@test.com',
      user_name: 'Test User',
      data_amount: 1024,
      validity_days: 30,
      country_name: 'Test Country'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test order:', insertError);
      
      // If the error is about missing columns, we need to add them
      if (insertError.message.includes('esim_code') || insertError.message.includes('column')) {
        console.log('🔧 Adding missing columns to orders table...');
        
        // Since we can't execute raw SQL, let's create a new table with the correct schema
        console.log('⚠️  Please run the following SQL in your Supabase dashboard:');
        console.log('');
        console.log('-- Add missing columns to orders table');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_code VARCHAR(255) UNIQUE;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code_data TEXT;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS data_amount INTEGER;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS validity_days INTEGER;');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_name VARCHAR(255);');
        console.log('');
        console.log('-- Create indexes');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_esim_code ON orders(esim_code);');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);');
        console.log('');
        console.log('After running the SQL, restart the test.');
      }
      return;
    }
    
    console.log('✅ esim_code column exists and is working!');
    
    // Clean up test record
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.warn('⚠️  Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('🎉 Orders table schema is correct!');
    
  } catch (error) {
    console.error('❌ Error fixing orders table:', error);
  }
}

fixOrdersTable().catch(console.error); 