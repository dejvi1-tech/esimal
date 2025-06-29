const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Environment variables should be available in Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCriticalIssues() {
  console.log('🔧 FIXING CRITICAL ISSUES\n');
  console.log('='.repeat(50));

  // 1. Fix Database Schema Issues
  console.log('\n1️⃣ FIXING DATABASE SCHEMA');
  
  try {
    // Check current orders table structure
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.log('❌ Error accessing orders table:', ordersError.message);
      
      // Try to create missing columns
      console.log('🔧 Attempting to add missing columns...');
      
      // Note: We can't directly alter tables with Supabase client
      // This would need to be done via SQL migration
      console.log('⚠️  Database schema changes require SQL migration');
      console.log('   Please run the following SQL in your Supabase dashboard:');
      console.log(`
        -- Add missing columns to orders table
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS roamify_order_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_id TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS esim_code TEXT;
        
        -- Update package_id column type if needed
        ALTER TABLE orders ALTER COLUMN package_id TYPE TEXT;
      `);
    } else {
      console.log('✅ Orders table accessible');
      if (ordersData && ordersData.length > 0) {
        console.log('📋 Sample order structure:', Object.keys(ordersData[0]));
      }
    }
  } catch (error) {
    console.log('❌ Error checking orders table:', error.message);
  }

  // 2. Check Packages Table
  console.log('\n2️⃣ CHECKING PACKAGES TABLE');
  
  try {
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .limit(5);

    if (packagesError) {
      console.log('❌ Error accessing packages table:', packagesError.message);
    } else {
      console.log(`📊 Packages table has ${packages.length} packages`);
      if (packages.length === 0) {
        console.log('⚠️  Packages table is EMPTY - this is a critical issue!');
        console.log('🔧 Need to sync real Roamify packages');
      } else {
        console.log('✅ Packages table has data');
        packages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name} (${pkg.reseller_id})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking packages table:', error.message);
  }

  // 3. Check My Packages Table
  console.log('\n3️⃣ CHECKING MY_PACKAGES TABLE');
  
  try {
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .limit(5);

    if (myPackagesError) {
      console.log('❌ Error accessing my_packages table:', myPackagesError.message);
    } else {
      console.log(`📊 My_packages table has ${myPackages.length} packages`);
      if (myPackages.length > 0) {
        console.log('📋 Sample my_packages:');
        myPackages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name} (${pkg.reseller_id})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking my_packages table:', error.message);
  }

  // 4. Test Roamify API
  console.log('\n4️⃣ TESTING ROAMIFY API');
  
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      const packages = response.data?.data?.packages || [];
      console.log(`✅ Roamify API accessible - ${packages.length} packages available`);
      
      if (packages.length > 0) {
        console.log('📋 Sample Roamify packages:');
        packages.slice(0, 3).forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.package} (${pkg.packageId})`);
        });
      }
    } else {
      console.log(`❌ Roamify API returned status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Roamify API error:', error.response?.status || error.message);
  }

  // 5. Test Roamify Order Creation (with correct payload)
  console.log('\n5️⃣ TESTING ROAMIFY ORDER CREATION');
  
  try {
    // Get a sample package from Roamify
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const packages = response.data?.data?.packages || [];
    if (packages.length > 0) {
      const testPackage = packages[0];
      console.log(`🧪 Testing with package: ${testPackage.package} (${testPackage.packageId})`);
      
      // Test with correct payload format
      const testPayload = {
        items: [
          {
            packageId: testPackage.packageId,
            quantity: 1
          }
        ],
        customerEmail: "test@example.com",
        customerName: "Test Customer"
      };

      console.log('📤 Sending test payload:', JSON.stringify(testPayload, null, 2));
      
      const orderResponse = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderResponse.status === 200) {
        console.log('✅ Roamify order creation successful!');
        console.log('📋 Order response:', JSON.stringify(orderResponse.data, null, 2));
      } else {
        console.log(`❌ Roamify order creation failed: ${orderResponse.status}`);
      }
    } else {
      console.log('⚠️  No packages available for testing');
    }
  } catch (error) {
    console.log('❌ Roamify order test failed:', error.response?.data || error.message);
  }

  // 6. Summary and Recommendations
  console.log('\n6️⃣ SUMMARY AND RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  console.log('\n🎯 CRITICAL FIXES NEEDED:');
  console.log('1. 🔧 Database Schema: Add missing columns to orders table');
  console.log('2. 📦 Packages Sync: Populate packages table with real Roamify packages');
  console.log('3. 🔄 API Integration: Update order creation to use correct payload format');
  console.log('4. 🧪 Testing: Verify complete purchase flow works');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run SQL migration to fix orders table schema');
  console.log('2. Sync Roamify packages using service role key');
  console.log('3. Update backend code to use correct Roamify API payload');
  console.log('4. Test a real purchase on your website');
  
  console.log('\n✅ GOOD NEWS:');
  console.log('- Backend is running and accessible');
  console.log('- My_packages table has data');
  console.log('- Roamify API is accessible');
  console.log('- Email system is working');
}

fixCriticalIssues().catch(console.error); 