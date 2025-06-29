const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMyPackagesSchema() {
  console.log('Checking my_packages table schema...\n');

  try {
    // Get a sample record to see the structure
    const { data: samplePackage, error: sampleError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error fetching sample package:', sampleError);
      return;
    }

    if (samplePackage && samplePackage.length > 0) {
      const package = samplePackage[0];
      console.log('Sample package structure:');
      console.log(JSON.stringify(package, null, 2));
      
      console.log('\nAvailable columns:');
      Object.keys(package).forEach(key => {
        console.log(`- ${key}: ${typeof package[key]} (${package[key]})`);
      });
    } else {
      console.log('No packages found in my_packages table');
    }

    // Check if there are any packages with reseller_id that might be real Roamify IDs
    console.log('\n=== PACKAGES WITH RESELLER_ID ===');
    const { data: packagesWithResellerId, error: resellerError } = await supabase
      .from('my_packages')
      .select('*')
      .not('reseller_id', 'is', null);

    if (resellerError) {
      console.error('Error fetching packages with reseller_id:', resellerError);
    } else {
      console.log(`Found ${packagesWithResellerId.length} packages with reseller_id:`);
      packagesWithResellerId.slice(0, 10).forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Reseller ID: ${pkg.reseller_id}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkMyPackagesSchema().catch(console.error); 