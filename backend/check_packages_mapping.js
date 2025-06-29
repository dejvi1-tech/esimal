const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackagesMapping() {
  console.log('Checking packages and my_packages mapping...\n');

  try {
    // Check packages table
    console.log('=== PACKAGES TABLE ===');
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .limit(5);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return;
    }

    console.log(`Found ${packages.length} packages in packages table:`);
    packages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
      console.log(`   Features Package ID: ${pkg.features?.packageId || 'NULL'}`);
      console.log('   ---');
    });

    // Check my_packages table
    console.log('\n=== MY_PACKAGES TABLE ===');
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(5);

    if (myPackagesError) {
      console.error('Error fetching my_packages:', myPackagesError);
      return;
    }

    console.log(`Found ${myPackages.length} my_packages with reseller_id:`);
    myPackages.forEach((myPkg, index) => {
      console.log(`${index + 1}. ${myPkg.name}`);
      console.log(`   ID: ${myPkg.id}`);
      console.log(`   Reseller ID: ${myPkg.reseller_id}`);
      console.log('   ---');
    });

    // Test mapping
    console.log('\n=== TESTING MAPPING ===');
    if (myPackages.length > 0) {
      const testMyPackage = myPackages[0];
      console.log(`Testing mapping for: ${testMyPackage.name} (${testMyPackage.reseller_id})`);
      
      const { data: matchingPackage, error: matchError } = await supabase
        .from('packages')
        .select('id, name, features')
        .eq('reseller_id', testMyPackage.reseller_id)
        .single();

      if (matchError) {
        console.error('Error finding matching package:', matchError);
      } else if (matchingPackage) {
        console.log(`✅ MAPPING WORKS!`);
        console.log(`   My Package: ${testMyPackage.name} (${testMyPackage.reseller_id})`);
        console.log(`   Real Package: ${matchingPackage.name} (${matchingPackage.features.packageId})`);
        console.log(`   Real Roamify Package ID: ${matchingPackage.features.packageId}`);
      } else {
        console.log(`❌ NO MATCH FOUND for reseller_id: ${testMyPackage.reseller_id}`);
      }
    }

    // Check if we have any packages with real Roamify packageIds
    console.log('\n=== PACKAGES WITH REAL ROAMIFY PACKAGE IDs ===');
    const { data: packagesWithRealIds, error: realIdsError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .not('features->packageId', 'is', null)
      .limit(5);

    if (realIdsError) {
      console.error('Error fetching packages with real IDs:', realIdsError);
    } else {
      console.log(`Found ${packagesWithRealIds.length} packages with real Roamify packageIds:`);
      packagesWithRealIds.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   Real Roamify Package ID: ${pkg.features.packageId}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('Error checking packages mapping:', error);
  }
}

checkPackagesMapping().catch(console.error); 