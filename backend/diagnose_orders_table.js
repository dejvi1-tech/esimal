const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseOrdersTable() {
  console.log('🔍 Diagnosing orders table structure...');
  
  try {
    // Get a real package ID
    const { data: packages, error: packagesError } = await supabase
      .from('my_packages')
      .select('id')
      .limit(1);
    
    if (packagesError || !packages || packages.length === 0) {
      console.error('❌ No packages found');
      return;
    }
    
    const packageId = packages[0].id;
    console.log(`📦 Using package ID: ${packageId}`);
    
    // Try different combinations of order data to identify the issue
    const testCases = [
      {
        name: 'Minimal order',
        data: {
          amount: 0.01,
          status: 'pending'
        }
      },
      {
        name: 'Order with packageId only',
        data: {
          packageId: packageId,
          amount: 0.01,
          status: 'pending'
        }
      },
      {
        name: 'Order with all fields',
        data: {
          packageId: packageId,
          amount: 2.99,
          status: 'paid',
          esim_code: 'TEST-ESIM-1234-5678-9012',
          qr_code_data: 'LPA:1$esimfly.al$TEST-ESIM-1234-5678-9012$Test Package',
          user_email: 'test@esimfly.al',
          user_name: 'Test User',
          data_amount: 1024,
          validity_days: 30,
          country_name: 'Test Country'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([testCase.data])
          .select();
        
        if (error) {
          console.error(`❌ ${testCase.name} failed:`, error.message);
          
          // Check if it's a UUID error
          if (error.message.includes('uuid')) {
            console.log('🔧 UUID type error detected');
            console.log('📋 Data being inserted:', JSON.stringify(testCase.data, null, 2));
          }
        } else {
          console.log(`✅ ${testCase.name} succeeded`);
          console.log('📋 Inserted data:', data[0]);
          
          // Clean up
          await supabase
            .from('orders')
            .delete()
            .eq('id', data[0].id);
        }
      } catch (e) {
        console.error(`❌ ${testCase.name} exception:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing orders table:', error);
  }
}

diagnoseOrdersTable().catch(console.error); 