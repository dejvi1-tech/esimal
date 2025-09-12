const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMontenegroSlugs() {
  console.log('🔍 Checking Montenegro package slugs in database...\n');

  try {
    // Check my_packages table for Montenegro
    console.log('📦 Checking my_packages table for Montenegro...');
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, slug, country_name, data_amount, days, base_price, sale_price')
      .or('country_name.ilike.%montenegro%,country_name.ilike.%me%')
      .order('country_name', { ascending: true });

    if (myPackagesError) {
      console.error('❌ Error fetching my_packages:', myPackagesError);
      return;
    }

    console.log(`✅ Found ${myPackages.length} Montenegro packages in my_packages table`);
    
    if (myPackages.length > 0) {
      console.log('\n🇲🇪 Montenegro packages found:');
      myPackages.forEach(pkg => {
        console.log(`  - ID: ${pkg.id}`);
        console.log(`    Name: ${pkg.name}`);
        console.log(`    Slug: ${pkg.slug}`);
        console.log(`    Country: ${pkg.country_name}`);
        console.log(`    Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`    Price: ${pkg.sale_price || pkg.base_price}`);
        console.log('');
      });
    } else {
      console.log('❌ No Montenegro packages found in my_packages table');
    }

    // Check packages table for Montenegro
    console.log('📦 Checking packages table for Montenegro...');
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, slug, country_name, data_amount, days, base_price, sale_price')
      .or('country_name.ilike.%montenegro%,country_name.ilike.%me%')
      .order('country_name', { ascending: true });

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError);
      return;
    }

    console.log(`✅ Found ${packages.length} Montenegro packages in packages table`);
    
    if (packages.length > 0) {
      console.log('\n🇲🇪 Montenegro packages in packages table:');
      packages.forEach(pkg => {
        console.log(`  - ID: ${pkg.id}`);
        console.log(`    Name: ${pkg.name}`);
        console.log(`    Slug: ${pkg.slug}`);
        console.log(`    Country: ${pkg.country_name}`);
        console.log(`    Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`    Price: ${pkg.sale_price || pkg.base_price}`);
        console.log('');
      });
    } else {
      console.log('❌ No Montenegro packages found in packages table');
    }

    // Check for specific Montenegro slug patterns
    console.log('\n🔍 Checking for Montenegro slug patterns...');
    
    // Check for 'me-' pattern (should be 'montenegro-')
    const mePatternPackages = myPackages.filter(pkg => 
      pkg.slug?.includes('me-') || pkg.slug?.includes('esim-me-')
    );
    
    if (mePatternPackages.length > 0) {
      console.log('⚠️  Found packages with "me-" pattern (should be "montenegro-"):');
      mePatternPackages.forEach(pkg => {
        console.log(`  - Slug: ${pkg.slug}`);
        console.log(`    Should be: ${pkg.slug?.replace('me-', 'montenegro-').replace('esim-me-', 'esim-montenegro-')}`);
        console.log('');
      });
    } else {
      console.log('✅ No packages found with "me-" pattern');
    }

    // Check for 'montenegro-' pattern (correct)
    const montenegroPatternPackages = myPackages.filter(pkg => 
      pkg.slug?.includes('montenegro-') || pkg.slug?.includes('esim-montenegro-')
    );
    
    if (montenegroPatternPackages.length > 0) {
      console.log('✅ Found packages with correct "montenegro-" pattern:');
      montenegroPatternPackages.forEach(pkg => {
        console.log(`  - Slug: ${pkg.slug}`);
        console.log('');
      });
    } else {
      console.log('❌ No packages found with correct "montenegro-" pattern');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('1. Montenegro should use country code "ME" in database');
    console.log('2. Montenegro should use "montenegro" in slugs (not "me")');
    console.log('3. Frontend mapping shows Montenegro -> "me" (lowercase)');
    console.log('4. Backend sync shows Montenegro -> "ME" (uppercase)');
    console.log('5. Need to ensure consistency between frontend and backend');

  } catch (error) {
    console.error('❌ Error checking Montenegro slugs:', error);
  }
}

checkMontenegroSlugs().catch(console.error); 