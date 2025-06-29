const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMyPackages() {
  try {
    console.log('Checking my_packages table...');
    
    // First, let's see what columns exist
    const { data: sample, error: sampleError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Table columns:', Object.keys(sample[0]));
      console.log('Sample row:', JSON.stringify(sample[0], null, 2));
    }
    
    // Now search for Europe & US package
    console.log('\nSearching for Europe & US package...');
    const { data: europeUs, error: europeError } = await supabase
      .from('my_packages')
      .select('*')
      .or('name.ilike.%europe%,name.ilike.%us%,slug.ilike.%europe%,slug.ilike.%us%')
      .limit(10);
    
    if (europeError) {
      console.error('Error searching for Europe & US:', europeError);
      return;
    }
    
    console.log(`Found ${europeUs.length} packages that might be Europe & US:`);
    europeUs.forEach((pkg, index) => {
      console.log(`\n${index + 1}. ${pkg.name || pkg.slug}`);
      console.log('   Slug:', pkg.slug);
      console.log('   ID:', pkg.id);
      console.log('   All fields:', JSON.stringify(pkg, null, 2));
    });
    
    // Check if we have reseller_id or packageId fields
    if (europeUs.length > 0) {
      const firstPkg = europeUs[0];
      console.log('\nChecking for reseller_id or packageId fields...');
      console.log('Has reseller_id:', 'reseller_id' in firstPkg);
      console.log('Has packageId:', 'packageId' in firstPkg);
      console.log('Has roamify_package_id:', 'roamify_package_id' in firstPkg);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkMyPackages(); 