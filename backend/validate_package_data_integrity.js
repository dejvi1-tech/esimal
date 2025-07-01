require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validatePackageDataIntegrity() {
  console.log('🔍 Starting Package Data Integrity Validation\n');
  
  try {
    // 1. Check all orders for invalid package_id references
    console.log('📋 Checking orders table for invalid package_id references...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, package_id, status, created_at, user_email, stripe_payment_intent_id');
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message);
      return;
    }
    
    console.log(`Found ${orders.length} orders to validate`);
    
    let invalidOrdersCount = 0;
    let validOrdersCount = 0;
    const invalidOrders = [];
    
    for (const order of orders) {
      if (!order.package_id) {
        console.log(`⚠️  Order ${order.id} has null package_id`);
        invalidOrdersCount++;
        invalidOrders.push({
          orderId: order.id,
          issue: 'null package_id',
          packageId: order.package_id,
          status: order.status,
        });
        continue;
      }
      
      // Check if package_id exists in my_packages
      const { data: myPackage, error: myPackageError } = await supabase
        .from('my_packages')
        .select('id, name')
        .eq('id', order.package_id)
        .single();
      
      // Check if package_id exists in packages  
      const { data: package_, error: packageError } = await supabase
        .from('packages')
        .select('id, name')
        .eq('id', order.package_id)
        .single();
      
      if ((!myPackage || myPackageError) && (!package_ || packageError)) {
        console.log(`❌ Order ${order.id} references non-existent package_id: ${order.package_id}`);
        invalidOrdersCount++;
        invalidOrders.push({
          orderId: order.id,
          issue: 'package_id not found in any table',
          packageId: order.package_id,
          status: order.status,
          userEmail: order.user_email,
          paymentIntentId: order.stripe_payment_intent_id,
        });
      } else {
        validOrdersCount++;
        const foundIn = myPackage ? 'my_packages' : 'packages';
        const packageName = myPackage ? myPackage.name : package_.name;
        if (validOrdersCount <= 3) { // Only log first few valid ones
          console.log(`✅ Order ${order.id} -> ${foundIn}: ${packageName}`);
        }
      }
    }
    
    console.log(`\n📊 Orders Validation Summary:`);
    console.log(`   ✅ Valid orders: ${validOrdersCount}`);
    console.log(`   ❌ Invalid orders: ${invalidOrdersCount}`);
    
    if (invalidOrders.length > 0) {
      console.log(`\n🚨 Invalid Orders Details:`);
      invalidOrders.forEach(order => {
        console.log(`   Order ID: ${order.orderId}`);
        console.log(`   Issue: ${order.issue}`);
        console.log(`   Package ID: ${order.packageId}`);
        console.log(`   Status: ${order.status}`);
        if (order.userEmail) console.log(`   Email: ${order.userEmail}`);
        if (order.paymentIntentId) console.log(`   Payment Intent: ${order.paymentIntentId}`);
        console.log('   ---');
      });
    }
    
    // 2. Check user_orders table
    console.log('\n👥 Checking user_orders table for invalid package_id references...');
    const { data: userOrders, error: userOrdersError } = await supabase
      .from('user_orders')
      .select('id, package_id, user_id, status');
    
    if (userOrdersError) {
      console.error('❌ Error fetching user_orders:', userOrdersError.message);
    } else {
      let invalidUserOrdersCount = 0;
      let validUserOrdersCount = 0;
      
      for (const userOrder of userOrders) {
        if (!userOrder.package_id) {
          invalidUserOrdersCount++;
          continue;
        }
        
        // Check if package_id exists in my_packages or packages
        const { data: myPackage } = await supabase
          .from('my_packages')
          .select('id')
          .eq('id', userOrder.package_id)
          .single();
        
        const { data: package_ } = await supabase
          .from('packages')
          .select('id')
          .eq('id', userOrder.package_id)
          .single();
        
        if (!myPackage && !package_) {
          console.log(`❌ UserOrder ${userOrder.id} references non-existent package_id: ${userOrder.package_id}`);
          invalidUserOrdersCount++;
        } else {
          validUserOrdersCount++;
        }
      }
      
      console.log(`📊 User Orders Validation Summary:`);
      console.log(`   ✅ Valid user orders: ${validUserOrdersCount}`);
      console.log(`   ❌ Invalid user orders: ${invalidUserOrdersCount}`);
    }
    
    // 3. Analyze package distribution
    console.log('\n📦 Package Distribution Analysis:');
    const { data: myPackagesCount } = await supabase
      .from('my_packages')
      .select('id', { count: 'exact' });
    
    const { data: packagesCount } = await supabase
      .from('packages')
      .select('id', { count: 'exact' });
    
    console.log(`   my_packages table: ${myPackagesCount?.length || 0} packages`);
    console.log(`   packages table: ${packagesCount?.length || 0} packages`);
    
    // 4. Check for specific problematic package ID
    const problematicPackageId = '75d227ab-7b42-47af-a9af-15e8e59caafc';
    console.log(`\n🎯 Checking for specific problematic package ID: ${problematicPackageId}`);
    
    const { data: myPackageCheck } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', problematicPackageId)
      .single();
    
    const { data: packageCheck } = await supabase
      .from('packages')
      .select('*')
      .eq('id', problematicPackageId)
      .single();
    
    if (myPackageCheck) {
      console.log(`✅ Found in my_packages:`, myPackageCheck.name);
    } else if (packageCheck) {
      console.log(`✅ Found in packages:`, packageCheck.name);
    } else {
      console.log(`❌ NOT FOUND in either table`);
      
      // Check if any orders reference this package
      const { data: ordersWithPackage } = await supabase
        .from('orders')
        .select('id, status, created_at, user_email')
        .eq('package_id', problematicPackageId);
      
      if (ordersWithPackage && ordersWithPackage.length > 0) {
        console.log(`🚨 CRITICAL: ${ordersWithPackage.length} orders reference this non-existent package:`);
        ordersWithPackage.forEach(order => {
          console.log(`   Order ${order.id} (${order.status}) - ${order.user_email || 'Guest'}`);
        });
      }
    }
    
    console.log('\n✅ Package Data Integrity Validation Complete\n');
    
    if (invalidOrdersCount > 0) {
      console.log('🛠️  RECOMMENDATIONS:');
      console.log('1. Review the invalid orders listed above');
      console.log('2. For orders with missing packages, check if the package was deleted');
      console.log('3. Consider adding database constraints to prevent this in future');
      console.log('4. Update the webhook controller to validate package existence before processing');
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  }
}

validatePackageDataIntegrity().catch(console.error); 