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

async function debugDatabaseSchema() {
  console.log('🔍 Debugging database schema...\n');
  
  try {
    // Check my_packages table structure
    console.log('📋 Checking my_packages table structure...');
    const { data: myPackagesSample, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);
    
    if (myPackagesError) {
      console.error('❌ Error accessing my_packages:', myPackagesError);
    } else if (myPackagesSample && myPackagesSample.length > 0) {
      console.log('✅ my_packages table structure:');
      const sample = myPackagesSample[0];
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} (${sample[key]})`);
      });
    } else {
      console.log('⚠️  my_packages table is empty');
    }
    
    // Check packages table structure
    console.log('\n📋 Checking packages table structure...');
    const { data: packagesSample, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .limit(1);
    
    if (packagesError) {
      console.error('❌ Error accessing packages:', packagesError);
    } else if (packagesSample && packagesSample.length > 0) {
      console.log('✅ packages table structure:');
      const sample = packagesSample[0];
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} (${sample[key]})`);
      });
    } else {
      console.log('⚠️  packages table is empty');
    }
    
    // Check orders table structure
    console.log('\n📋 Checking orders table structure...');
    const { data: ordersSample, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error accessing orders:', ordersError);
    } else if (ordersSample && ordersSample.length > 0) {
      console.log('✅ orders table structure:');
      const sample = ordersSample[0];
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} (${sample[key]})`);
      });
    } else {
      console.log('⚠️  orders table is empty');
    }
    
    // Check the specific packages that were in recent orders
    console.log('\n🔍 Checking packages from recent orders...');
    const packageIds = ['96e5b866-9421-4def-aed7-2339f61a5f36', 'cd837948-dcab-487b-b080-4112e5c3d0e6'];
    
    for (const packageId of packageIds) {
      console.log(`\n📦 Checking package ID: ${packageId}`);
      
      // Check in packages table
      const { data: package, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (packageError) {
        console.error(`❌ Error fetching package ${packageId}:`, packageError);
      } else if (package) {
        console.log(`✅ Package found in packages table:`);
        console.log(`   ID: ${package.id}`);
        console.log(`   Name: ${package.name}`);
        console.log(`   Country: ${package.country_name}`);
        console.log(`   Data: ${package.data_amount}GB, Days: ${package.days}`);
        console.log(`   Features.packageId: ${package.features?.packageId || 'NULL'}`);
        console.log(`   Reseller ID: ${package.reseller_id || 'NULL'}`);
        console.log(`   Is Active: ${package.is_active}`);
      } else {
        console.log(`⚠️  Package ${packageId} not found in packages table`);
      }
      
      // Check in my_packages table (if it has the right columns)
      try {
        const { data: myPackage, error: myPackageError } = await supabase
          .from('my_packages')
          .select('*')
          .eq('id', packageId)
          .single();
        
        if (myPackageError) {
          console.log(`   my_packages query error: ${myPackageError.message}`);
        } else if (myPackage) {
          console.log(`✅ Package found in my_packages table:`);
          console.log(`   ID: ${myPackage.id}`);
          console.log(`   Name: ${myPackage.name}`);
          console.log(`   Features.packageId: ${myPackage.features?.packageId || 'NULL'}`);
        } else {
          console.log(`   Package ${packageId} not found in my_packages table`);
        }
      } catch (error) {
        console.log(`   Error checking my_packages: ${error.message}`);
      }
    }
    
    // Check for any packages that might be causing issues
    console.log('\n🔍 Checking for packages that might cause 500 errors...');
    const { data: allPackages, error: allError } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);
    
    if (allError) {
      console.error('❌ Error fetching all packages:', allError);
    } else if (allPackages && allPackages.length > 0) {
      console.log(`✅ Found ${allPackages.length} active packages`);
      
      // Check for packages with potential issues
      const problematicPackages = allPackages.filter(pkg => {
        return !pkg.reseller_id || 
               !pkg.features?.packageId || 
               pkg.features.packageId.startsWith('esim-') === false;
      });
      
      if (problematicPackages.length > 0) {
        console.log(`⚠️  Found ${problematicPackages.length} potentially problematic packages:`);
        problematicPackages.forEach((pkg, index) => {
          console.log(`\n${index + 1}. Potentially problematic package:`);
          console.log(`   ID: ${pkg.id}`);
          console.log(`   Name: ${pkg.name}`);
          console.log(`   Country: ${pkg.country_name}`);
          console.log(`   Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
          console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        });
      } else {
        console.log('✅ All active packages look good');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug
debugDatabaseSchema()
  .then(() => {
    console.log('\n🎉 Schema debug completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema debug failed:', error);
    process.exit(1);
  }); 