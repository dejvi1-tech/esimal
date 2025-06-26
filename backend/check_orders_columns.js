const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrdersColumns() {
  console.log('🔍 Checking orders table columns...');
  
  try {
    // Try to get column information by attempting different column names
    const testQueries = [
      'SELECT * FROM orders LIMIT 0',
      'SELECT id, user_id, package_id, packageId, amount, status FROM orders LIMIT 0',
      'SELECT id, "user_id", "package_id", "packageId", amount, status FROM orders LIMIT 0'
    ];
    
    for (const query of testQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (!error) {
          console.log('✅ Query successful:', query);
        }
      } catch (e) {
        console.log('❌ Query failed:', query, e.message);
      }
    }
    
    // Try a simple insert with minimal data
    console.log('\n🧪 Testing minimal insert...');
    const minimalOrder = {
      amount: 0.01,
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('orders')
      .insert([minimalOrder])
      .select();
    
    if (insertError) {
      console.error('❌ Minimal insert failed:', insertError);
      
      // Try to identify the required columns
      if (insertError.message.includes('packageId')) {
        console.log('🔧 Found packageId column (camelCase)');
      }
      if (insertError.message.includes('package_id')) {
        console.log('🔧 Found package_id column (snake_case)');
      }
      if (insertError.message.includes('user_id')) {
        console.log('🔧 Found user_id column');
      }
    } else {
      console.log('✅ Minimal insert successful');
      console.log('📋 Available columns:', Object.keys(insertData[0]));
      
      // Clean up
      await supabase
        .from('orders')
        .delete()
        .eq('id', insertData[0].id);
    }
    
  } catch (error) {
    console.error('❌ Error checking orders columns:', error);
  }
}

checkOrdersColumns().catch(console.error); 