const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkOrderStatus() {
  console.log('🔍 Checking order status for recent payment...\n');

  try {
    // Check for the specific payment intent
    const paymentIntentId = 'pi_3Rf6vGDEHnCVTkPq1y2XHTnR';
    const customerEmail = 'egli.kasa1@gmail.com';
    
    console.log(`📋 Looking for order with payment intent: ${paymentIntentId}`);
    console.log(`📧 Customer email: ${customerEmail}\n`);

    // Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntentId);

    if (ordersError) {
      console.error('❌ Error checking orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('❌ No order found with this payment intent ID');
      console.log('🔍 This means the order creation failed during payment intent creation');
      return;
    }

    console.log(`✅ Found ${orders.length} order(s):`);
    orders.forEach((order, index) => {
      console.log(`\n📦 Order ${index + 1}:`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Package ID: ${order.package_id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Amount: $${order.amount}`);
      console.log(`   Guest Email: ${order.guest_email}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Updated: ${order.updated_at}`);
      console.log(`   eSIM Code: ${order.esim_code || 'Not set'}`);
    });

    // Also check by email
    console.log(`\n🔍 Checking orders by email: ${customerEmail}`);
    const { data: emailOrders, error: emailError } = await supabase
      .from('orders')
      .select('*')
      .eq('guest_email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(5);

    if (emailError) {
      console.error('❌ Error checking orders by email:', emailError);
      return;
    }

    if (emailOrders && emailOrders.length > 0) {
      console.log(`\n📧 Recent orders for ${customerEmail}:`);
      emailOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ID: ${order.id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Amount: $${order.amount}`);
        console.log(`      Created: ${order.created_at}`);
        console.log(`      eSIM Code: ${order.esim_code || 'Not set'}`);
      });
    } else {
      console.log(`\n❌ No orders found for email: ${customerEmail}`);
    }

    // Check if the package exists
    console.log(`\n🔍 Checking if package exists: esim-europe-us-30days-5gb-all`);
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', 'esim-europe-us-30days-5gb-all')
      .single();

    if (packageError) {
      console.error('❌ Error checking package:', packageError);
      return;
    }

    if (packageData) {
      console.log('✅ Package found:');
      console.log(`   ID: ${packageData.id}`);
      console.log(`   Name: ${packageData.name}`);
      console.log(`   Country: ${packageData.country_name}`);
      console.log(`   Data: ${packageData.data_amount}MB`);
      console.log(`   Price: $${packageData.sale_price}`);
      console.log(`   Reseller ID: ${packageData.reseller_id}`);
      console.log(`   Visible: ${packageData.visible}`);
    } else {
      console.log('❌ Package not found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkOrderStatus(); 