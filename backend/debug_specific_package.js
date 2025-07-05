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

async function debugSpecificPackage() {
  console.log('🔍 Debugging specific package that caused 500 error...\n');
  
  try {
    // Look for the specific problematic package ID from logs
    const problematicPackageId = '297cf3cd-ee01-47de-835d-af0b36e9f2b8';
    
    console.log(`🔍 Looking for package with ID: ${problematicPackageId}`);
    
    // Search in my_packages table
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .or(`id.eq.${problematicPackageId},features->packageId.eq.${problematicPackageId}`);
    
    if (myPackagesError) {
      console.error('❌ Error searching my_packages:', myPackagesError);
    } else if (myPackages && myPackages.length > 0) {
      console.log(`✅ Found ${myPackages.length} packages in my_packages table:`);
      myPackages.forEach((pkg, index) => {
        console.log(`\n${index + 1}. Package Details:`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Region: ${pkg.region || 'NULL'}`);
      });
    } else {
      console.log('⚠️  Package not found in my_packages table');
    }
    
    // Search in packages table as well
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .or(`id.eq.${problematicPackageId},features->packageId.eq.${problematicPackageId}`);
    
    if (packagesError) {
      console.error('❌ Error searching packages:', packagesError);
    } else if (packages && packages.length > 0) {
      console.log(`\n✅ Found ${packages.length} packages in packages table:`);
      packages.forEach((pkg, index) => {
        console.log(`\n${index + 1}. Package Details:`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Region: ${pkg.region || 'NULL'}`);
      });
    } else {
      console.log('⚠️  Package not found in packages table');
    }
    
    // Check for Sweden 100GB packages specifically
    console.log('\n🔍 Checking for Sweden 100GB packages...');
    const { data: swedenPackages, error: swedenError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_name', 'Sweden')
      .eq('data_amount', 100)
      .eq('days', 30);
    
    if (swedenError) {
      console.error('❌ Error searching Sweden packages:', swedenError);
    } else if (swedenPackages && swedenPackages.length > 0) {
      console.log(`✅ Found ${swedenPackages.length} Sweden 100GB packages:`);
      swedenPackages.forEach((pkg, index) => {
        console.log(`\n${index + 1}. Sweden Package:`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Features.packageId: ${pkg.features?.packageId || 'NULL'}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        
        // Check if this package ID is a UUID
        const packageId = pkg.features?.packageId;
        if (packageId) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId);
          console.log(`   Is UUID: ${isUUID ? 'YES ❌' : 'NO ✅'}`);
          
          if (isUUID) {
            console.log(`   ⚠️  This package has a UUID as packageId and needs fixing!`);
          }
        }
      });
    } else {
      console.log('⚠️  No Sweden 100GB packages found');
    }
    
    // Check for any packages with UUID package IDs
    console.log('\n🔍 Checking for any packages with UUID package IDs...');
    const { data: allPackages, error: allError } = await supabase
      .from('my_packages')
      .select('*')
      .not('features->packageId', 'is', null);
    
    if (allError) {
      console.error('❌ Error fetching all packages:', allError);
    } else {
      const uuidPackages = allPackages.filter(pkg => {
        const packageId = pkg.features?.packageId;
        return packageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageId);
      });
      
      if (uuidPackages.length > 0) {
        console.log(`⚠️  Found ${uuidPackages.length} packages with UUID package IDs:`);
        uuidPackages.forEach((pkg, index) => {
          console.log(`\n${index + 1}. Package with UUID:`);
          console.log(`   ID: ${pkg.id}`);
          console.log(`   Name: ${pkg.name}`);
          console.log(`   Country: ${pkg.country_name}`);
          console.log(`   Features.packageId: ${pkg.features?.packageId}`);
        });
      } else {
        console.log('✅ No packages with UUID package IDs found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug
debugSpecificPackage()
  .then(() => {
    console.log('\n🎉 Debug completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }); 