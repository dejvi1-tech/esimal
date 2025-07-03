const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPackageMismatch() {
  try {
    console.log('🔍 Investigating package mismatch issue...\n');

    // 1. Check for Germany packages
    console.log('=== GERMANY PACKAGES ===');
    const { data: germanyPackages, error: germanyError } = await supabase
      .from('my_packages')
      .select('*')
      .ilike('country_name', '%germany%')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (germanyError) {
      console.error('Error fetching Germany packages:', germanyError);
    } else {
      console.log(`Found ${germanyPackages.length} Germany packages:`);
      germanyPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log(`   Features: ${pkg.features?.packageId || 'NONE'}`);
        console.log('   ---');
      });
    }

    // 2. Check for Europe & United States packages
    console.log('\n=== EUROPE & UNITED STATES PACKAGES ===');
    const { data: europeUsPackages, error: europeUsError } = await supabase
      .from('my_packages')
      .select('*')
      .ilike('country_name', '%europe%united%states%')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (europeUsError) {
      console.error('Error fetching Europe & US packages:', europeUsError);
    } else {
      console.log(`Found ${europeUsPackages.length} Europe & United States packages:`);
      europeUsPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log(`   Features: ${pkg.features?.packageId || 'NONE'}`);
        console.log('   ---');
      });
    }

    // 3. Check for 1GB packages specifically
    console.log('\n=== ALL 1GB PACKAGES ===');
    const { data: oneGbPackages, error: oneGbError } = await supabase
      .from('my_packages')
      .select('*')
      .gte('data_amount', 0.9)
      .lte('data_amount', 1.1)
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (!oneGbError && oneGbPackages) {
      console.log(`Found ${oneGbPackages.length} packages around 1GB:`);
      oneGbPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log(`   Country Code: ${pkg.country_code}`);
        console.log(`   Features: ${pkg.features?.packageId || 'NONE'}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugPackageMismatch();
