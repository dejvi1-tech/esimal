const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPackageMapping() {
  console.log('🔍 Debugging package mapping...\n');

  // Check my_packages table
  console.log('📦 Checking my_packages table...');
  const { data: myPackages, error: myPackagesError } = await supabase
    .from('my_packages')
    .select('id, name, reseller_id, location_slug')
    .limit(5);

  if (myPackagesError) {
    console.error('Error fetching my_packages:', myPackagesError);
    return;
  }

  console.log('my_packages records:');
  myPackages.forEach(pkg => {
    console.log(`  - ID: ${pkg.id}`);
    console.log(`    Name: ${pkg.name}`);
    console.log(`    reseller_id: ${pkg.reseller_id || 'NULL'}`);
    console.log(`    location_slug: ${pkg.location_slug || 'NULL'}`);
    console.log('');
  });

  // Check packages table
  console.log('📦 Checking packages table...');
  const { data: packages, error: packagesError } = await supabase
    .from('packages')
    .select('id, name, reseller_id, features')
    .limit(5);

  if (packagesError) {
    console.error('Error fetching packages:', packagesError);
    return;
  }

  console.log('packages records:');
  packages.forEach(pkg => {
    console.log(`  - ID: ${pkg.id}`);
    console.log(`    Name: ${pkg.name}`);
    console.log(`    reseller_id: ${pkg.reseller_id || 'NULL'}`);
    console.log(`    features.packageId: ${pkg.features?.packageId || 'NULL'}`);
    console.log('');
  });

  // Try to find the specific package that's failing
  console.log('🔍 Looking for the failing package...');
  const failingPackageId = 'esim-europe-us-30days-3gb-all';
  
  // Check in my_packages
  const { data: failingMyPackage, error: failingMyError } = await supabase
    .from('my_packages')
    .select('*')
    .eq('id', failingPackageId)
    .single();

  if (failingMyError) {
    console.log(`❌ Package not found in my_packages: ${failingPackageId}`);
  } else {
    console.log(`✅ Found in my_packages:`);
    console.log(`   - ID: ${failingMyPackage.id}`);
    console.log(`   - Name: ${failingMyPackage.name}`);
    console.log(`   - reseller_id: ${failingMyPackage.reseller_id || 'NULL'}`);
    console.log(`   - location_slug: ${failingMyPackage.location_slug || 'NULL'}`);
  }

  // Check if there's a corresponding package in packages table
  if (failingMyPackage?.reseller_id) {
    const { data: correspondingPackage, error: correspondingError } = await supabase
      .from('packages')
      .select('*')
      .eq('reseller_id', failingMyPackage.reseller_id)
      .single();

    if (correspondingError) {
      console.log(`❌ No corresponding package found in packages table for reseller_id: ${failingMyPackage.reseller_id}`);
    } else {
      console.log(`✅ Found corresponding package in packages table:`);
      console.log(`   - ID: ${correspondingPackage.id}`);
      console.log(`   - Name: ${correspondingPackage.name}`);
      console.log(`   - reseller_id: ${correspondingPackage.reseller_id}`);
      console.log(`   - features.packageId: ${correspondingPackage.features?.packageId || 'NULL'}`);
    }
  }

  console.log('\n💡 Recommendations:');
  console.log('1. Check if the packages table has been synced from Roamify');
  console.log('2. Verify that reseller_id values match between my_packages and packages tables');
  console.log('3. Run the syncRoamifyPackages endpoint to populate the packages table');
}

debugPackageMapping().catch(console.error); 