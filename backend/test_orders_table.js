const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkOrdersTableSchema() {
  console.log('🔍 Testing orders table...\n');

  try {
    console.log('🔍 Testing basic order creation...');

    // Test creating a minimal order with only basic columns
    const testOrder = {
      package_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      guest_email: 'test@example.com',
      amount: 2.49,
      status: 'pending',
      payment_intent_id: 'pi_test_' + Date.now(),
    };

    console.log('📝 Test order data:', testOrder);

    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test order:', createError);
      
      // Try with even more minimal data
      console.log('\n🔄 Trying with minimal data...');
      const minimalOrder = {
        package_id: '00000000-0000-0000-0000-000000000000',
        amount: 2.49,
        status: 'pending',
      };

      const { data: minimalOrderData, error: minimalError } = await supabase
        .from('orders')
        .insert(minimalOrder)
        .select()
        .single();

      if (minimalError) {
        console.error('❌ Error creating minimal order:', minimalError);
      } else {
        console.log('✅ Minimal order created successfully:', minimalOrderData.id);
        
        // Clean up
        await supabase
          .from('orders')
          .delete()
          .eq('id', minimalOrderData.id);
        console.log('🧹 Minimal test order cleaned up');
      }
    } else {
      console.log('✅ Test order created successfully:', order.id);
      
      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      console.log('🧹 Test order cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkOrdersTableSchema(); 