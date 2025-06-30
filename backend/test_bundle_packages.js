const { createClient } = require('@supabase/supabase-js');

// This script will be run locally, so we'll need to set up environment variables
// For now, let's create a simple test that can be run with proper env vars

async function testBundlePackages() {
  console.log('Testing bundle packages for Albania and Germany...\n');
  
  // Check if environment variables are available
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Environment variables not found. Please set:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('\nYou can run this with:');
    console.log('SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node test_bundle_packages.js');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Test Albania packages
    console.log('🔍 Checking Albania (AL) packages...');
    const { data: albaniaPackages, error: alError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'AL')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (alError) {
      console.error('❌ Error fetching Albania packages:', alError);
    } else {
      console.log(`✅ Found ${albaniaPackages?.length || 0} Albania packages`);
      if (albaniaPackages && albaniaPackages.length > 0) {
        console.log('Sample Albania package:');
        console.log(JSON.stringify(albaniaPackages[0], null, 2));
      }
    }

    // Test Germany packages
    console.log('\n🔍 Checking Germany (DE) packages...');
    const { data: germanyPackages, error: deError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'DE')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (deError) {
      console.error('❌ Error fetching Germany packages:', deError);
    } else {
      console.log(`✅ Found ${germanyPackages?.length || 0} Germany packages`);
      if (germanyPackages && germanyPackages.length > 0) {
        console.log('Sample Germany package:');
        console.log(JSON.stringify(germanyPackages[0], null, 2));
      }
    }

    // Check all packages in my_packages table
    console.log('\n🔍 Checking all packages in my_packages table...');
    const { data: allPackages, error: allError } = await supabase
      .from('my_packages')
      .select('country_code, country_name, visible, show_on_frontend')
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching all packages:', allError);
    } else {
      console.log(`✅ Found ${allPackages?.length || 0} total packages in my_packages table`);
      console.log('Sample packages:');
      allPackages?.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.country_name} (${pkg.country_code}) - visible: ${pkg.visible}, show_on_frontend: ${pkg.show_on_frontend}`);
      });
    }

    // Check if there are any packages with country_code but wrong visibility
    console.log('\n🔍 Checking packages with country_code but wrong visibility...');
    const { data: wrongVisibility, error: visError } = await supabase
      .from('my_packages')
      .select('country_code, country_name, visible, show_on_frontend')
      .or('country_code.eq.AL,country_code.eq.DE')
      .or('visible.eq.false,show_on_frontend.eq.false');

    if (visError) {
      console.error('❌ Error checking visibility:', visError);
    } else {
      console.log(`✅ Found ${wrongVisibility?.length || 0} packages with country_code AL/DE but wrong visibility`);
      if (wrongVisibility && wrongVisibility.length > 0) {
        console.log('Packages that need visibility fix:');
        wrongVisibility.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.country_name} (${pkg.country_code}) - visible: ${pkg.visible}, show_on_frontend: ${pkg.show_on_frontend}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBundlePackages(); 