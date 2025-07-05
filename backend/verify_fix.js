const { createClient } = require('@supabase/supabase-js');

// Environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('🔍 Verifying package reference fix...\n');
  
  try {
    // Check recent orders to see if they have valid package references
    console.log('📋 Checking recent orders for valid package references...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      console.error('❌ Error fetching recent orders:', ordersError);
    } else if (recentOrders && recentOrders.length > 0) {
      console.log(`✅ Found ${recentOrders.length} recent orders:`);
      
      let validOrders = 0;
      let invalidOrders = 0;
      
      for (const order of recentOrders) {
        console.log(`\n📦 Order ${order.id}:`);
        console.log(`   Package ID: ${order.package_id || 'NULL'}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Amount: ${order.amount}`);
        
        if (order.package_id) {
          // Check if this package exists in packages table
          const { data: package, error: packageError } = await supabase
            .from('packages')
            .select('*')
            .eq('id', order.package_id)
            .single();
          
          if (packageError) {
            console.log(`   ❌ Package ${order.package_id} not found in packages table`);
            invalidOrders++;
          } else {
            console.log(`   ✅ Package ${order.package_id} exists and is valid`);
            console.log(`      Name: ${package.name}`);
            console.log(`      Country: ${package.country_name}`);
            console.log(`      Features.packageId: ${package.features?.packageId || 'NULL'}`);
            console.log(`      Reseller ID: ${package.reseller_id || 'NULL'}`);
            validOrders++;
          }
        } else {
          console.log(`   ❌ Order has no package_id`);
          invalidOrders++;
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Valid orders: ${validOrders}`);
      console.log(`   ❌ Invalid orders: ${invalidOrders}`);
      console.log(`   📈 Success rate: ${((validOrders / recentOrders.length) * 100).toFixed(1)}%`);
      
      if (invalidOrders === 0) {
        console.log(`\n🎉 All orders have valid package references!`);
      } else {
        console.log(`\n⚠️  ${invalidOrders} orders still need fixing`);
      }
    } else {
      console.log('⚠️  No recent orders found');
    }
    
    // Check if there are any orders with the old problematic package IDs
    console.log('\n🔍 Checking for any remaining problematic package IDs...');
    const problematicPackageIds = [
      'esim-europe-us-30days-3gb-all',
      'esim-germany-30days-1gb-all',
      'esim-denmark-30days-1024mb-1750855107563-werdai',
      'esim-denmark-30days-5120mb-1750855474628-hzjllh',
      '75d227ab-7b42-47af-a9af-15e8e59caafc',
      'cd837948-dcab-487b-b080-4112e5c3d0e6',
      '96e5b866-9421-4def-aed7-2339f61a5f36'
    ];
    
    let foundProblematic = 0;
    
    for (const packageId of problematicPackageIds) {
      const { data: orders, error: error } = await supabase
        .from('orders')
        .select('*')
        .eq('package_id', packageId);
      
      if (!error && orders && orders.length > 0) {
        console.log(`⚠️  Found ${orders.length} orders still using problematic package ID: ${packageId}`);
        foundProblematic += orders.length;
      }
    }
    
    if (foundProblematic === 0) {
      console.log('✅ No orders found with problematic package IDs');
    } else {
      console.log(`⚠️  Total orders with problematic package IDs: ${foundProblematic}`);
    }
    
    // Check the default package that was used for fixes
    console.log('\n🔍 Checking the default package used for fixes...');
    const { data: defaultPackage, error: defaultError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', '6429f5e8-5664-4d5e-a3c9-4f7786fb0ca1')
      .single();
    
    if (defaultError) {
      console.error('❌ Error fetching default package:', defaultError);
    } else if (defaultPackage) {
      console.log('✅ Default package details:');
      console.log(`   ID: ${defaultPackage.id}`);
      console.log(`   Name: ${defaultPackage.name}`);
      console.log(`   Country: ${defaultPackage.country_name}`);
      console.log(`   Features.packageId: ${defaultPackage.features?.packageId || 'NULL'}`);
      console.log(`   Reseller ID: ${defaultPackage.reseller_id || 'NULL'}`);
      console.log(`   Is Active: ${defaultPackage.is_active}`);
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyFix()
  .then(() => {
    console.log('\n🎉 Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }); 