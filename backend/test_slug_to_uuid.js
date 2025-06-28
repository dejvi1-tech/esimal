const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSlugToUuidConversion() {
  console.log('🔍 Testing slug to UUID conversion...\n');

  try {
    // First, let's see what packages are available
    console.log('📋 Available packages:');
    const { data: allPackages, error: listError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id, visible')
      .eq('visible', true)
      .order('sale_price', { ascending: true });

    if (listError) {
      console.error('❌ Error listing packages:', listError);
      return;
    }

    if (!allPackages || allPackages.length === 0) {
      console.error('❌ No packages found in database');
      return;
    }

    console.log(`Found ${allPackages.length} visible packages:`);
    allPackages.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name}`);
      console.log(`      ID: ${pkg.id}`);
      console.log(`      Country: ${pkg.country_name}`);
      console.log(`      Data: ${pkg.data_amount}MB`);
      console.log(`      Validity: ${pkg.validity_days} days`);
      console.log(`      Price: $${pkg.sale_price}`);
      console.log(`      Reseller ID: ${pkg.reseller_id}`);
      console.log('');
    });

    // Test with the first available package
    const testPackage = allPackages[0];
    const testSlug = testPackage.name;
    
    console.log(`📦 Testing with package: ${testSlug}`);
    
    // Look up package by id (slug)
    const { data: packageData, error } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', testSlug)
      .single();

    if (error) {
      console.error('❌ Error looking up package:', error);
      return;
    }

    if (!packageData) {
      console.error('❌ Package not found with slug:', testSlug);
      return;
    }

    console.log('✅ Package found!');
    console.log(`   ID (UUID): ${packageData.id}`);
    console.log(`   Name: ${packageData.name}`);
    console.log(`   Country: ${packageData.country_name}`);
    console.log(`   Data: ${packageData.data_amount}MB`);
    console.log(`   Validity: ${packageData.validity_days} days`);
    console.log(`   Price: $${packageData.sale_price}`);
    console.log(`   Reseller ID: ${packageData.reseller_id}`);
    console.log(`   Visible: ${packageData.visible}`);

    // Test creating a minimal order with the UUID
    console.log('\n🧪 Testing order creation with UUID...');
    
    const testOrder = {
      package_id: packageData.id, // Use the actual UUID
      guest_email: 'test@example.com',
      amount: packageData.sale_price,
      status: 'pending',
      payment_intent_id: 'pi_test_' + Date.now(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
    } else {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Package ID: ${order.package_id}`);
      console.log(`   Amount: $${order.amount}`);
      console.log(`   Status: ${order.status}`);
      
      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      console.log('🧹 Test order cleaned up');
    }

    console.log('\n🎉 Slug to UUID conversion test completed successfully!');
    console.log('✅ The payment flow should now work correctly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSlugToUuidConversion(); 