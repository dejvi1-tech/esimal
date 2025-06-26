const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrdersSchema() {
  console.log('🔍 Checking orders table schema...');
  
  try {
    // Try to get a sample record to see what columns exist
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying orders table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Orders table has data');
      console.log('📋 Available columns:');
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof data[0][column]}`);
      });
    } else {
      console.log('ℹ️  Orders table is empty');
      
      // Try to insert a minimal record to see what columns are required
      const minimalOrder = {
        package_id: '00000000-0000-0000-0000-000000000000',
        amount: 0.01,
        status: 'pending'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert([minimalOrder])
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting minimal order:', insertError);
      } else {
        console.log('✅ Minimal order inserted successfully');
        console.log('📋 Available columns:');
        Object.keys(insertData[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof insertData[0][column]}`);
        });
        
        // Clean up
        await supabase
          .from('orders')
          .delete()
          .eq('id', insertData[0].id);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking orders schema:', error);
  }
}

checkOrdersSchema().catch(console.error); 