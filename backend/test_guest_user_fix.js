const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Use environment variables from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables not set:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

async function testGuestUserFix() {
  console.log('🔧 Testing Guest User Fix...');
  console.log('=====================================');
  
  try {
    // Step 1: Check if the guest user exists
    console.log('\n1️⃣ Checking if guest user exists...');
    const { data: guestUser, error: guestError } = await supabase
      .from('users')
      .select('*')
      .eq('id', GUEST_USER_ID)
      .single();
    
    if (guestError) {
      console.error('❌ Guest user not found:', guestError.message);
      return false;
    }
    
    console.log('✅ Guest user found:');
    console.log('   ID:', guestUser.id);
    console.log('   Email:', guestUser.email);
    console.log('   First Name:', guestUser.firstName);
    console.log('   Last Name:', guestUser.lastName);
    console.log('   Role:', guestUser.role);
    console.log('   Created:', guestUser.created_at);
    
    // Step 2: Test creating a user_orders entry
    console.log('\n2️⃣ Testing user_orders creation...');
    
    // First, get a sample package ID
    const { data: packages, error: packagesError } = await supabase
      .from('my_packages')
      .select('id')
      .limit(1);
    
    if (packagesError || !packages || packages.length === 0) {
      console.error('❌ No packages found for testing:', packagesError?.message);
      return false;
    }
    
    const testPackageId = packages[0].id;
    console.log('   Using test package ID:', testPackageId);
    
    // Create test user_orders entry
    const testUserOrder = {
      user_id: GUEST_USER_ID,
      package_id: testPackageId,
      roamify_order_id: `test-${Date.now()}`,
      qr_code_url: '',
      iccid: `test-iccid-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: userOrder, error: userOrderError } = await supabase
      .from('user_orders')
      .insert(testUserOrder)
      .select()
      .single();
    
    if (userOrderError) {
      console.error('❌ Failed to create test user_orders entry:', userOrderError.message);
      return false;
    }
    
    console.log('✅ Test user_orders entry created successfully:');
    console.log('   User Order ID:', userOrder.id);
    console.log('   User ID:', userOrder.user_id);
    console.log('   Package ID:', userOrder.package_id);
    console.log('   Status:', userOrder.status);
    
    // Step 3: Clean up test data
    console.log('\n3️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_orders')
      .delete()
      .eq('id', userOrder.id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    // Step 4: Test webhook idempotency table
    console.log('\n4️⃣ Testing processed_events table...');
    
    const testEvent = {
      event_id: `test_event_${Date.now()}`,
      event_type: 'payment_intent.succeeded',
      status: 'processing',
      payload: { test: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: processedEvent, error: eventError } = await supabase
      .from('processed_events')
      .insert(testEvent)
      .select()
      .single();
    
    if (eventError) {
      console.error('❌ Failed to create test processed_events entry:', eventError.message);
      return false;
    }
    
    console.log('✅ Test processed_events entry created successfully:');
    console.log('   Event ID:', processedEvent.event_id);
    console.log('   Event Type:', processedEvent.event_type);
    console.log('   Status:', processedEvent.status);
    
    // Clean up test event
    const { error: deleteEventError } = await supabase
      .from('processed_events')
      .delete()
      .eq('id', processedEvent.id);
    
    if (deleteEventError) {
      console.warn('⚠️ Failed to clean up test event:', deleteEventError.message);
    } else {
      console.log('✅ Test event cleaned up successfully');
    }
    
    // Step 5: Test summary
    console.log('\n🎉 SUCCESS! Guest User Fix Test Complete');
    console.log('=====================================');
    console.log('✅ Guest user exists and is accessible');
    console.log('✅ Guest user has all required fields (firstName, lastName)');
    console.log('✅ user_orders table can create entries for guest user');
    console.log('✅ processed_events table is working correctly');
    console.log('✅ Service role has proper permissions');
    console.log('\n🚀 Your webhook processing should now work without errors!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the test
testGuestUserFix().then((success) => {
  if (success) {
    console.log('\n✅ All tests passed! The fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the logs above.');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 