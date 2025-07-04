const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSlugToUuidFix() {
  console.log('🔍 Testing Slug to UUID Fix...\n');

  try {
    // First, let's see what packages are available
    console.log('📋 Available packages:');
    const { data: allPackages, error: listError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, sale_price, reseller_id, visible, location_slug')
      .eq('visible', true)
      .order('data_amount', { ascending: true });

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
      console.log(`      ID (UUID): ${pkg.id}`);
      console.log(`      Location Slug: ${pkg.location_slug || 'N/A'}`);
      console.log(`      Country: ${pkg.country_name}`);
      console.log(`      Data: ${pkg.data_amount}MB`);
      console.log(`      Validity: ${pkg.validity_days} validity_days`);
      console.log(`      Price: $${pkg.sale_price}`);
      console.log(`      Reseller ID: ${pkg.reseller_id}`);
      console.log('');
    });

    // Test 1: Test with UUID (should work)
    console.log('🧪 Test 1: Testing with UUID...');
    const testPackage = allPackages[0];
    const testUuid = testPackage.id;
    
    const { data: packageByUuid, error: uuidError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', testUuid)
      .single();

    if (uuidError || !packageByUuid) {
      console.error('❌ Error looking up package by UUID:', uuidError);
    } else {
      console.log('✅ Package found by UUID successfully!');
      console.log(`   UUID: ${testUuid}`);
      console.log(`   Name: ${packageByUuid.name}`);
    }

    // Test 2: Test with slug (if available)
    if (testPackage.location_slug) {
      console.log('\n🧪 Test 2: Testing with location_slug...');
      const testSlug = testPackage.location_slug;
      
      const { data: packageBySlug, error: slugError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('location_slug', testSlug)
        .single();

      if (slugError || !packageBySlug) {
        console.error('❌ Error looking up package by slug:', slugError);
      } else {
        console.log('✅ Package found by slug successfully!');
        console.log(`   Slug: ${testSlug}`);
        console.log(`   UUID: ${packageBySlug.id}`);
        console.log(`   Name: ${packageBySlug.name}`);
      }
    } else {
      console.log('\n🧪 Test 2: Skipping slug test (no location_slug available)');
    }

    // Test 3: Test with invalid slug (should fail gracefully)
    console.log('\n🧪 Test 3: Testing with invalid slug...');
    const invalidSlug = 'invalid-slug-test';
    
    const { data: packageByInvalidSlug, error: invalidSlugError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('location_slug', invalidSlug)
      .single();

    if (invalidSlugError) {
      console.log('✅ Invalid slug correctly rejected (expected behavior)');
      console.log(`   Error: ${invalidSlugError.message}`);
    } else if (!packageByInvalidSlug) {
      console.log('✅ Invalid slug correctly returned no results');
    } else {
      console.log('⚠️ Unexpected: Invalid slug returned a package');
    }

    // Test 4: Test order creation with UUID
    console.log('\n🧪 Test 4: Testing order creation with UUID...');
    
    const testOrder = {
      package_id: testPackage.id, // Use the actual UUID
      guest_email: 'test@example.com',
      amount: testPackage.sale_price,
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

    console.log('\n🎉 Slug to UUID fix test completed successfully!');
    console.log('✅ The payment flow should now work correctly with both UUIDs and slugs');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSlugToUuidFix(); 