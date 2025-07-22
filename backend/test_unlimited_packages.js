const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUnlimitedPackages() {
  console.log('🧪 TESTING UNLIMITED PACKAGES FUNCTIONALITY\n');
  
  // Test 1: Create unlimited package via API
  console.log('1️⃣ Testing unlimited package creation...');
  
  const testPackage = {
    name: 'Test Unlimited Europe',
    country_name: 'Europe',
    country_code: 'EU',
    data_amount: 0, // unlimited
    days: 7,
    base_price: 19.99,
    sale_price: 23.99,
    profit: 4.00,
    region: 'Europe',
    visible: true,
    show_on_frontend: true,
    location_slug: 'europe',
    homepage_order: 1,
    features: {
      isUnlimited: true,
      packageId: 'esim-eu-7days-unlimited-all'
    }
  };
  
  try {
    const { data: createdPackage, error: createError } = await supabase
      .from('my_packages')
      .insert(testPackage)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create unlimited package:', createError.message);
      return;
    }
    
    console.log('✅ Successfully created unlimited package!');
    console.log(`   ID: ${createdPackage.id}`);
    console.log(`   Data: ${createdPackage.data_amount}GB (0 = unlimited)`);
    console.log(`   isUnlimited: ${createdPackage.features?.isUnlimited}`);
    
    // Test 2: Query unlimited packages
    console.log('\n2️⃣ Testing unlimited package queries...');
    
    const { data: unlimitedPackages, error: queryError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('data_amount', 0)
      .eq('visible', true);
    
    if (queryError) {
      console.error('❌ Query error:', queryError.message);
    } else {
      console.log(`✅ Found ${unlimitedPackages.length} unlimited packages`);
      unlimitedPackages.forEach(pkg => {
        console.log(`   - ${pkg.name}: ${pkg.data_amount}GB, €${pkg.sale_price}`);
      });
    }
    
    // Test 3: Frontend API endpoint
    console.log('\n3️⃣ Testing frontend API...');
    
    const { data: frontendPackages, error: frontendError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('show_on_frontend', true)
      .order('data_amount', { ascending: true });
    
    if (frontendError) {
      console.error('❌ Frontend query error:', frontendError.message);
    } else {
      console.log(`✅ Frontend API would return ${frontendPackages.length} packages`);
      const unlimited = frontendPackages.filter(p => p.data_amount === 0);
      console.log(`   Including ${unlimited.length} unlimited packages`);
    }
    
    // Test 4: Data formatting
    console.log('\n4️⃣ Testing data amount formatting...');
    
    function formatDataAmount(dataAmount) {
      if (dataAmount === 0) return 'Unlimited';
      if (dataAmount >= 1) {
        return dataAmount % 1 === 0 ? `${dataAmount} GB` : `${dataAmount.toFixed(1)} GB`;
      }
      const mb = Math.round(dataAmount * 1024);
      return `${mb} MB`;
    }
    
    const testAmounts = [0, 1, 3, 5, 10, 0.5];
    testAmounts.forEach(amount => {
      const formatted = formatDataAmount(amount);
      console.log(`   ${amount}GB → "${formatted}"`);
    });
    
    // Test 5: Check database constraints
    console.log('\n5️⃣ Testing database constraints...');
    
    const testConstraintPackage = {
      id: 'constraint-test-' + Date.now(),
      name: 'Constraint Test',
      country_name: 'Test',
      country_code: 'TC',
      data_amount: 0, // This should NOT be blocked anymore
      days: 0, // This should NOT be blocked anymore  
      base_price: 5.99,
      sale_price: 5.99,
      visible: true,
      show_on_frontend: false,
      region: 'Test'
    };
    
    const { data: constraintTest, error: constraintError } = await supabase
      .from('my_packages')
      .insert(testConstraintPackage)
      .select()
      .single();
    
    if (constraintError) {
      console.error('❌ Constraint test failed:', constraintError.message);
      console.log('💡 Database constraints may still be blocking unlimited packages');
      console.log('   Please run the migration: 20250103000020_enable_unlimited_packages.sql');
    } else {
      console.log('✅ Database constraints allow unlimited packages!');
      
      // Clean up constraint test
      await supabase
        .from('my_packages')
        .delete()
        .eq('id', constraintTest.id);
    }
    
    // Clean up test package
    console.log('\n🧹 Cleaning up test packages...');
    await supabase
      .from('my_packages')
      .delete()
      .eq('id', createdPackage.id);
    console.log('✅ Test cleanup complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('-'.repeat(50));
  console.log('✅ Unlimited package creation: Check logs above');
  console.log('✅ Database queries: Check logs above');  
  console.log('✅ Frontend compatibility: Check logs above');
  console.log('✅ Data formatting: Check logs above');
  console.log('✅ Database constraints: Check logs above');
  
  console.log('\n💡 Next steps:');
  console.log('1. Run the database migration if constraints failed');
  console.log('2. Test unlimited packages in frontend');
  console.log('3. Create real unlimited packages via admin panel');
  console.log('4. Test eSIM ordering flow for unlimited packages');
}

testUnlimitedPackages().catch(console.error); 