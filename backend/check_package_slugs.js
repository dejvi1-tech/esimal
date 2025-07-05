const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPackageSlugs() {
  console.log('🔍 Checking package slugs in database...\n');

  try {
    // Check my_packages table
    console.log('📦 Checking my_packages table...');
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, slug, country_name, data_amount, days')
      .order('country_name', { ascending: true });

    if (myPackagesError) {
      console.error('❌ Error fetching my_packages:', myPackagesError);
      return;
    }

    console.log(`✅ Found ${myPackages.length} packages in my_packages table`);
    
    // Find Greece packages
    const greecePackages = myPackages.filter(pkg => 
      pkg.country_name?.toLowerCase().includes('greece') || 
      pkg.slug?.includes('gr-') || 
      pkg.slug?.includes('greece')
    );

    console.log('\n🇬🇷 Greece packages found:');
    greecePackages.forEach(pkg => {
      console.log(`  - ID: ${pkg.id}`);
      console.log(`    Name: ${pkg.name}`);
      console.log(`    Slug: ${pkg.slug}`);
      console.log(`    Country: ${pkg.country_name}`);
      console.log(`    Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log('');
    });

    // Check packages table
    console.log('📦 Checking packages table...');
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, slug, country_name, data_amount, days')
      .order('country_name', { ascending: true });

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError);
      return;
    }

    console.log(`✅ Found ${packages.length} packages in packages table`);
    
    // Find Greece packages in packages table
    const greecePackages2 = packages.filter(pkg => 
      pkg.country_name?.toLowerCase().includes('greece') || 
      pkg.slug?.includes('gr-') || 
      pkg.slug?.includes('greece')
    );

    console.log('\n🇬🇷 Greece packages in packages table:');
    greecePackages2.forEach(pkg => {
      console.log(`  - ID: ${pkg.id}`);
      console.log(`    Name: ${pkg.name}`);
      console.log(`    Slug: ${pkg.slug}`);
      console.log(`    Country: ${pkg.country_name}`);
      console.log(`    Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log('');
    });

    // Check for the specific failing package ID
    console.log('🔍 Looking for the failing package ID: esim-gr-30days-1gb-all');
    const failingPackage = myPackages.find(pkg => pkg.slug === 'esim-gr-30days-1gb-all');
    
    if (failingPackage) {
      console.log('❌ Found the failing package in database:');
      console.log(`  - ID: ${failingPackage.id}`);
      console.log(`  - Name: ${failingPackage.name}`);
      console.log(`  - Slug: ${failingPackage.slug}`);
      console.log(`  - Country: ${failingPackage.country_name}`);
    } else {
      console.log('✅ The failing package ID is NOT in the database');
    }

    // Check for the working package ID
    console.log('\n🔍 Looking for the working package ID: esim-greece-30days-1gb-all');
    const workingPackage = myPackages.find(pkg => pkg.slug === 'esim-greece-30days-1gb-all');
    
    if (workingPackage) {
      console.log('✅ Found the working package in database:');
      console.log(`  - ID: ${workingPackage.id}`);
      console.log(`  - Name: ${workingPackage.name}`);
      console.log(`  - Slug: ${workingPackage.slug}`);
      console.log(`  - Country: ${workingPackage.country_name}`);
    } else {
      console.log('❌ The working package ID is NOT in the database');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('1. The failing package ID "esim-gr-30days-1gb-all" should be updated to "esim-greece-30days-1gb-all"');
    console.log('2. The Roamify API accepts "esim-greece-30days-1gb-all" but rejects "esim-gr-30days-1gb-all"');
    console.log('3. Need to update the database to use the correct package IDs');

  } catch (error) {
    console.error('❌ Error checking package slugs:', error);
  }
}

checkPackageSlugs().catch(console.error); 