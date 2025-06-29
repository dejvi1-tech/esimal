const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackagesTable() {
  console.log('Checking packages table...\n');

  try {
    // Get all packages from the packages table
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*');

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return;
    }

    console.log(`Found ${packages.length} packages in packages table:`);
    
    if (packages.length === 0) {
      console.log('The packages table is empty!');
      console.log('This table should contain the real Roamify packages.');
      console.log('You need to sync the packages from Roamify API to this table.');
      return;
    }

    packages.forEach((pkg, index) => {
      console.log(`${index + 1}. ID: ${pkg.id}`);
      console.log(`   Name: ${pkg.name}`);
      console.log(`   Slug: ${pkg.slug}`);
      console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
      console.log(`   Features: ${JSON.stringify(pkg.features, null, 2)}`);
      console.log(`   Package ID from features: ${pkg.features?.packageId || 'NULL'}`);
      console.log('   ---');
    });

    // Check for packages with real Roamify packageIds
    console.log('\n=== PACKAGES WITH REAL ROAMIFY PACKAGE IDs ===');
    const packagesWithRealIds = packages.filter(pkg => pkg.features?.packageId);
    console.log(`Found ${packagesWithRealIds.length} packages with real Roamify packageIds:`);
    
    packagesWithRealIds.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   Slug: ${pkg.slug}`);
      console.log(`   Reseller ID: ${pkg.reseller_id || 'NULL'}`);
      console.log(`   Real Roamify Package ID: ${pkg.features.packageId}`);
      console.log('   ---');
    });

    // Check for packages with reseller_id that might be real Roamify IDs
    console.log('\n=== PACKAGES WITH RESELLER_ID ===');
    const packagesWithResellerId = packages.filter(pkg => pkg.reseller_id);
    console.log(`Found ${packagesWithResellerId.length} packages with reseller_id:`);
    
    packagesWithResellerId.slice(0, 10).forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   Slug: ${pkg.slug}`);
      console.log(`   Reseller ID: ${pkg.reseller_id}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('Error checking packages table:', error);
  }
}

checkPackagesTable().catch(console.error); 