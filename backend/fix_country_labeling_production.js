require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use environment variables (no hardcoding)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.error('\nPlease ensure environment variables are configured in Render/Vercel dashboard.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCountryLabeling() {
  try {
    console.log('🔍 Analyzing country labeling issues...\n');
    
    // 1. Find packages with "Europe & United States eSIM Package" name but wrong country
    console.log('📋 Finding mismatched "Europe & United States" packages...');
    const { data: mismatchedPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States');

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError.message);
      return;
    }

    console.log(`Found ${mismatchedPackages.length} packages with incorrect country labeling:\n`);
    
    if (mismatchedPackages.length === 0) {
      console.log('✅ No packages found with country labeling issues!');
      return;
    }

    // Display the problematic packages
    mismatchedPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. Package ID: ${pkg.id}`);
      console.log(`   Name: ${pkg.name}`);
      console.log(`   ❌ Current Country: "${pkg.country_name}" (INCORRECT)`);
      console.log(`   ✅ Should be: "Europe & United States"`);
      console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}, Price: $${pkg.sale_price}`);
      console.log('');
    });

    // 2. Fix the country labeling
    console.log('🔧 Updating country names to "Europe & United States"...\n');
    
    const { data: updatedPackages, error: updateError } = await supabase
      .from('my_packages')
      .update({ 
        country_name: 'Europe & United States',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States')
      .select('*');

    if (updateError) {
      console.error('❌ Error updating packages:', updateError.message);
      return;
    }

    console.log(`✅ Successfully updated ${updatedPackages.length} packages!`);
    
    // 3. Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: remainingIssues, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States');

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError.message);
      return;
    }

    if (remainingIssues.length === 0) {
      console.log('✅ All "Europe & United States eSIM Package" entries now have correct country_name!\n');
    } else {
      console.log(`⚠️ Still ${remainingIssues.length} packages with incorrect labeling\n`);
      remainingIssues.forEach(pkg => {
        console.log(`- ${pkg.id}: "${pkg.country_name}" should be "Europe & United States"`);
      });
    }

    // 4. Show summary of all Europe & United States packages
    console.log('📊 Summary of all "Europe & United States" packages:');
    const { data: allEuropeUS, error: summaryError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_name', 'Europe & United States')
      .order('data_amount', { ascending: true });

    if (summaryError) {
      console.error('❌ Error getting summary:', summaryError.message);
      return;
    }

    console.log(`Total "Europe & United States" packages: ${allEuropeUS.length}\n`);
    
    allEuropeUS.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.data_amount}GB - ${pkg.days} days - $${pkg.sale_price} (ID: ${pkg.id.substring(0, 8)}...)`);
    });

    // 5. Check for any other country mismatches
    console.log('\n🔍 Checking for other potential country mismatches...');
    
    const countriesWithIssues = [
      { name: 'Dubai', correctCountry: 'Dubai' },
      { name: 'United Arab Emirates', correctCountry: 'Dubai' },
      { name: 'UAE', correctCountry: 'Dubai' }
    ];

    for (const check of countriesWithIssues) {
      const { data: otherIssues } = await supabase
        .from('my_packages')
        .select('*')
        .ilike('name', `%${check.name}%`)
        .neq('country_name', check.correctCountry);

      if (otherIssues && otherIssues.length > 0) {
        console.log(`⚠️ Found ${otherIssues.length} packages with "${check.name}" in name but wrong country`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the fix
console.log('🚀 Starting Country Labeling Fix for Production Database');
console.log('Environment: Production (using environment variables)');
console.log('Timestamp:', new Date().toISOString());
console.log('=' .repeat(60));

fixCountryLabeling().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Country labeling fix completed successfully!');
  console.log('Timestamp:', new Date().toISOString());
  process.exit(0);
}).catch(error => {
  console.error('\n' + '=' .repeat(60));
  console.error('❌ Script failed:', error.message);
  console.error('Timestamp:', new Date().toISOString());
  process.exit(1);
}); 