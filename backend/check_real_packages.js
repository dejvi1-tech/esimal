const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealPackages() {
  console.log('Checking real packages in database...\n');

  // Check my_packages table
  console.log('=== MY_PACKAGES TABLE ===');
  try {
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(20);

    if (myPackagesError) {
      console.error('Error fetching my_packages:', myPackagesError);
    } else {
      console.log(`Found ${myPackages.length} packages in my_packages table:`);
      myPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Slug: ${pkg.slug}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Features: ${JSON.stringify(pkg.features, null, 2)}`);
        console.log(`   Package ID from features: ${pkg.features?.packageId || 'NULL'}`);
        console.log('   ---');
      });
    }
  } catch (error) {
    console.error('Error accessing my_packages:', error);
  }

  // Check packages table
  console.log('\n=== PACKAGES TABLE ===');
  try {
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .limit(20);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    } else {
      console.log(`Found ${packages.length} packages in packages table:`);
      packages.forEach((pkg, index) => {
        console.log(`${index + 1}. ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Slug: ${pkg.slug}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Features: ${JSON.stringify(pkg.features, null, 2)}`);
        console.log(`   Package ID from features: ${pkg.features?.packageId || 'NULL'}`);
        console.log('   ---');
      });
    }
  } catch (error) {
    console.error('Error accessing packages:', error);
  }

  // Check for packages with real Roamify packageIds
  console.log('\n=== PACKAGES WITH REAL ROAMIFY PACKAGE IDs ===');
  
  // Check my_packages for real packageIds
  try {
    const { data: myPackagesWithRealIds, error: myError } = await supabase
      .from('my_packages')
      .select('*')
      .not('features->packageId', 'is', null);

    if (myError) {
      console.error('Error fetching my_packages with real IDs:', myError);
    } else {
      console.log(`Found ${myPackagesWithRealIds.length} packages in my_packages with real Roamify packageIds:`);
      myPackagesWithRealIds.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   Slug: ${pkg.slug}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Real Roamify Package ID: ${pkg.features.packageId}`);
        console.log('   ---');
      });
    }
  } catch (error) {
    console.error('Error checking my_packages with real IDs:', error);
  }

  // Check packages table for real packageIds
  try {
    const { data: packagesWithRealIds, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .not('features->packageId', 'is', null);

    if (pkgError) {
      console.error('Error fetching packages with real IDs:', pkgError);
    } else {
      console.log(`\nFound ${packagesWithRealIds.length} packages in packages table with real Roamify packageIds:`);
      packagesWithRealIds.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   Slug: ${pkg.slug}`);
        console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
        console.log(`   Real Roamify Package ID: ${pkg.features.packageId}`);
        console.log('   ---');
      });
    }
  } catch (error) {
    console.error('Error checking packages with real IDs:', error);
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('This will help us understand:');
  console.log('1. Which packages have real Roamify packageIds');
  console.log('2. What the mapping is between local slugs and real Roamify IDs');
  console.log('3. Whether we should update the fallback mechanism');
}

checkRealPackages().catch(console.error); 