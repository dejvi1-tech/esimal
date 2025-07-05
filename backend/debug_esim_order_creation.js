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

async function debugEsimOrderCreation() {
  console.log('🔍 Debugging eSIM order creation process...\n');
  
  try {
    // Check recent orders to understand the flow
    console.log('📋 Checking recent orders...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Error fetching recent orders:', ordersError);
    } else if (recentOrders && recentOrders.length > 0) {
      console.log(`✅ Found ${recentOrders.length} recent orders:`);
      recentOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order Details:`);
        console.log(`   ID: ${order.id}`);
        console.log(`   Package ID: ${order.package_id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${order.created_at}`);
        console.log(`   User ID: ${order.user_id}`);
        console.log(`   Amount: ${order.amount}`);
      });
    } else {
      console.log('⚠️  No recent orders found');
    }
    
    // Check the specific package that was causing issues
    console.log('\n🔍 Checking the Spain 1GB package that was found...');
    const { data: spainPackage, error: spainError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', '297cf3cd-ee01-47de-835d-af0b36e9f2b8')
      .single();
    
    if (spainError) {
      console.error('❌ Error fetching Spain package:', spainError);
    } else if (spainPackage) {
      console.log('✅ Spain Package Details:');
      console.log(`   ID: ${spainPackage.id}`);
      console.log(`   Name: ${spainPackage.name}`);
      console.log(`   Country: ${spainPackage.country_name}`);
      console.log(`   Data: ${spainPackage.data_amount}GB, Days: ${spainPackage.days}`);
      console.log(`   Features.packageId: ${spainPackage.features?.packageId || 'NULL'}`);
      console.log(`   Reseller ID: ${spainPackage.reseller_id || 'NULL'}`);
      console.log(`   Is Active: ${spainPackage.is_active}`);
      
      // Check if this package is in my_packages
      const { data: myPackages, error: myError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('package_id', spainPackage.id);
      
      if (myError) {
        console.error('❌ Error checking my_packages:', myError);
      } else if (myPackages && myPackages.length > 0) {
        console.log(`\n⚠️  This package exists in my_packages (${myPackages.length} entries):`);
        myPackages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. my_packages ID: ${pkg.id}`);
          console.log(`      Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
          console.log(`      Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        });
      } else {
        console.log('\n✅ Package not in my_packages table');
      }
    }
    
    // Check for any packages with missing or invalid reseller_id
    console.log('\n🔍 Checking for packages with missing reseller_id...');
    const { data: packagesWithoutReseller, error: resellerError } = await supabase
      .from('packages')
      .select('*')
      .or('reseller_id.is.null,reseller_id.eq.');
    
    if (resellerError) {
      console.error('❌ Error checking packages without reseller_id:', resellerError);
    } else if (packagesWithoutReseller && packagesWithoutReseller.length > 0) {
      console.log(`⚠️  Found ${packagesWithoutReseller.length} packages with missing reseller_id:`);
      packagesWithoutReseller.forEach((pkg, index) => {
        console.log(`\n${index + 1}. Package without reseller_id:`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
      });
    } else {
      console.log('✅ All packages have reseller_id');
    }
    
    // Check for packages with invalid features.packageId
    console.log('\n🔍 Checking for packages with invalid features.packageId...');
    const { data: allPackages, error: allError } = await supabase
      .from('packages')
      .select('*')
      .not('features->packageId', 'is', null);
    
    if (allError) {
      console.error('❌ Error fetching all packages:', allError);
    } else {
      const invalidPackages = allPackages.filter(pkg => {
        const packageId = pkg.features?.packageId;
        // Check if packageId is a UUID or doesn't follow Roamify format
        return packageId && (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId) ||
          !packageId.startsWith('esim-')
        );
      });
      
      if (invalidPackages.length > 0) {
        console.log(`⚠️  Found ${invalidPackages.length} packages with invalid features.packageId:`);
        invalidPackages.forEach((pkg, index) => {
          console.log(`\n${index + 1}. Package with invalid packageId:`);
          console.log(`   ID: ${pkg.id}`);
          console.log(`   Name: ${pkg.name}`);
          console.log(`   Country: ${pkg.country_name}`);
          console.log(`   Features.packageId: ${pkg.features?.packageId}`);
        });
      } else {
        console.log('✅ All packages have valid features.packageId');
      }
    }
    
    // Check the Roamify API key
    console.log('\n🔍 Checking Roamify API configuration...');
    if (process.env.ROAMIFY_API_KEY) {
      console.log('✅ ROAMIFY_API_KEY is set');
      console.log(`   Key length: ${process.env.ROAMIFY_API_KEY.length} characters`);
      console.log(`   Key starts with: ${process.env.ROAMIFY_API_KEY.substring(0, 10)}...`);
    } else {
      console.log('❌ ROAMIFY_API_KEY is not set');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug
debugEsimOrderCreation()
  .then(() => {
    console.log('\n🎉 Debug completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 