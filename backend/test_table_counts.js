require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableCounts() {
  try {
    console.log('Checking package counts in both tables...\n');

    // Check packages table
    const { count: packagesCount, error: packagesError } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (packagesError) {
      console.error('Error checking packages table:', packagesError);
    } else {
      console.log(`📦 packages table: ${packagesCount || 0} active packages`);
    }

    // Check my_packages table
    const { count: myPackagesCount, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true });

    if (myPackagesError) {
      console.error('Error checking my_packages table:', myPackagesError);
    } else {
      console.log(`📦 my_packages table: ${myPackagesCount || 0} packages`);
    }

    // Get sample packages from each table
    console.log('\n=== Sample packages from packages table ===');
    const { data: packagesSample, error: packagesSampleError } = await supabase
      .from('packages')
      .select('id, name, country_name, data_amount, validity_days, price, created_at')
      .eq('is_active', true)
      .limit(3);

    if (packagesSampleError) {
      console.error('Error getting packages sample:', packagesSampleError);
    } else {
      console.log(packagesSample || []);
    }

    console.log('\n=== Sample packages from my_packages table ===');
    const { data: myPackagesSample, error: myPackagesSampleError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, base_price, created_at')
      .limit(3);

    if (myPackagesSampleError) {
      console.error('Error getting my_packages sample:', myPackagesSampleError);
    } else {
      console.log(myPackagesSample || []);
    }

    console.log('\n=== Summary ===');
    if ((packagesCount || 0) > (myPackagesCount || 0)) {
      console.log('✅ packages table has more packages - this is correct for the admin panel');
    } else if ((myPackagesCount || 0) > (packagesCount || 0)) {
      console.log('⚠️  my_packages table has more packages - admin panel should query this table instead');
    } else {
      console.log('📊 Both tables have similar counts');
    }

  } catch (error) {
    console.error('Error checking table counts:', error);
  }
}

checkTableCounts(); 