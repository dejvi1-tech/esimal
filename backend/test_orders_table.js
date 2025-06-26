const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrdersTable() {
  console.log('🧪 Testing orders table structure...');
  
  try {
    // First, get a real package ID from my_packages
    console.log('📦 Fetching a real package ID...');
    const { data: packages, error: packagesError } = await supabase
      .from('my_packages')
      .select('id')
      .limit(1);
    
    if (packagesError || !packages || packages.length === 0) {
      console.error('❌ No packages found in my_packages table');
      console.log('🔧 Please add some packages to the my_packages table first');
      return;
    }
    
    const realPackageId = packages[0].id;
    console.log(`✅ Using package ID: ${realPackageId}`);
    
    // Test inserting a complete order record
    const testOrder = {
      packageId: realPackageId,
      amount: 2.99,
      status: 'paid',
      esim_code: 'TEST-ESIM-1234-5678-9012',
      qr_code_data: 'LPA:1$esimfly.al$TEST-ESIM-1234-5678-9012$Test Package',
      user_email: 'test@esimfly.al',
      user_name: 'Test User',
      data_amount: 1024, // 1GB in MB
      validity_days: 30,
      country_name: 'Test Country'
    };
    
    console.log('📝 Inserting test order...');
    const { data: insertData, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test order:', insertError);
      console.log('');
      console.log('🔧 Please run the SQL script in your Supabase dashboard:');
      console.log('   File: backend/fix_orders_table_complete.sql');
      return;
    }
    
    console.log('✅ Test order inserted successfully!');
    console.log('📋 Order details:');
    console.log(`   ID: ${insertData[0].id}`);
    console.log(`   eSIM Code: ${insertData[0].esim_code}`);
    console.log(`   Package ID: ${insertData[0].packageId}`);
    console.log(`   User Email: ${insertData[0].user_email}`);
    console.log(`   Amount: $${insertData[0].amount}`);
    console.log(`   Status: ${insertData[0].status}`);
    console.log(`   Created: ${insertData[0].created_at}`);
    
    // Clean up test record
    console.log('');
    console.log('🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.warn('⚠️  Could not clean up test record:', deleteError);
    } else {
      console.log('✅ Test record cleaned up');
    }
    
    console.log('');
    console.log('🎉 Orders table is working correctly!');
    console.log('✅ All required columns exist and are functional');
    console.log('✅ Ready for order flow testing');
    
  } catch (error) {
    console.error('❌ Error testing orders table:', error);
  }
}

testOrdersTable().catch(console.error); 