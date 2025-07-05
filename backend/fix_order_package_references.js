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

async function fixOrderPackageReferences() {
  console.log('🔧 Fixing order package references...\n');
  
  try {
    // First, let's see what orders have invalid package references
    console.log('📋 Checking orders with invalid package references...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .not('package_id', 'is', null);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    if (orders && orders.length > 0) {
      console.log(`✅ Found ${orders.length} orders with package_id:`);
      
      for (const order of orders) {
        console.log(`\n📦 Order ${order.id}:`);
        console.log(`   Package ID: ${order.package_id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Amount: ${order.amount}`);
        
        // Check if this package exists in packages table
        const { data: package, error: packageError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', order.package_id)
          .single();
        
        if (packageError) {
          console.log(`   ❌ Package ${order.package_id} not found in packages table`);
          
          // Find a suitable replacement package
          const { data: replacementPackage, error: replacementError } = await supabase
            .from('packages')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (replacementError) {
            console.log(`   ❌ No replacement package available`);
          } else {
            console.log(`   🔄 Will update to replacement package: ${replacementPackage.id}`);
            
            // Update the order with the replacement package
            const { error: updateError } = await supabase
              .from('orders')
              .update({ package_id: replacementPackage.id })
              .eq('id', order.id);
            
            if (updateError) {
              console.log(`   ❌ Failed to update order: ${updateError.message}`);
            } else {
              console.log(`   ✅ Order updated successfully`);
            }
          }
        } else {
          console.log(`   ✅ Package ${order.package_id} exists and is valid`);
        }
      }
    } else {
      console.log('⚠️  No orders with package_id found');
    }
    
    // Now let's check orders without package_id and assign them
    console.log('\n📋 Checking orders without package_id...');
    const { data: ordersWithoutPackage, error: ordersWithoutError } = await supabase
      .from('orders')
      .select('*')
      .or('package_id.is.null,package_id.eq.')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersWithoutError) {
      console.error('❌ Error fetching orders without package_id:', ordersWithoutError);
    } else if (ordersWithoutPackage && ordersWithoutPackage.length > 0) {
      console.log(`✅ Found ${ordersWithoutPackage.length} orders without package_id:`);
      
      // Get a default package to assign
      const { data: defaultPackage, error: defaultError } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (defaultError) {
        console.log('❌ No default package available');
      } else {
        console.log(`📦 Using default package: ${defaultPackage.id} (${defaultPackage.name})`);
        
        for (const order of ordersWithoutPackage) {
          console.log(`\n🔄 Updating order ${order.id}:`);
          console.log(`   Current status: ${order.status}`);
          console.log(`   Amount: ${order.amount}`);
          
          // Update the order with the default package
          const { error: updateError } = await supabase
            .from('orders')
            .update({ package_id: defaultPackage.id })
            .eq('id', order.id);
          
          if (updateError) {
            console.log(`   ❌ Failed to update order: ${updateError.message}`);
          } else {
            console.log(`   ✅ Order updated successfully`);
          }
        }
      }
    } else {
      console.log('✅ All orders have package_id');
    }
    
    // Let's also check if there are any packages in my_packages that should be in packages
    console.log('\n📋 Checking my_packages for packages that should be in packages table...');
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(10);
    
    if (myPackagesError) {
      console.error('❌ Error fetching my_packages:', myPackagesError);
    } else if (myPackages && myPackages.length > 0) {
      console.log(`✅ Found ${myPackages.length} packages in my_packages table`);
      
      for (const myPackage of myPackages) {
        console.log(`\n📦 my_packages entry: ${myPackage.id}`);
        console.log(`   Name: ${myPackage.name}`);
        console.log(`   Country: ${myPackage.country_name}`);
        console.log(`   Features.packageId: ${myPackage.features?.packageId || 'NULL'}`);
        
        // Check if this package exists in packages table
        const { data: existingPackage, error: existingError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', myPackage.id)
          .single();
        
        if (existingError) {
          console.log(`   ❌ Not in packages table - should be migrated`);
        } else {
          console.log(`   ✅ Already exists in packages table`);
        }
      }
    }
    
    console.log('\n🎉 Package reference fix completed!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

// Run the fix
fixOrderPackageReferences()
  .then(() => {
    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 