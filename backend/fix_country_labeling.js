require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the same approach as fix_data_amounts.js
const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('This script should be run on the cloud platform where environment variables are configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCountryLabeling() {
  try {
    console.log('🔍 Finding packages with inconsistent country labeling...');
    
    // Find packages with "Europe & United States eSIM Package" name but wrong country
    const { data: inconsistentPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States');

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    console.log(`📊 Found ${inconsistentPackages.length} packages with inconsistent labeling:`);
    inconsistentPackages.forEach(pkg => {
      console.log(`  - ID: ${pkg.id}`);
      console.log(`    Name: ${pkg.name}`);
      console.log(`    Current country: ${pkg.country_name}`);
      console.log(`    Data: ${pkg.data_amount}GB`);
      console.log('');
    });

    if (inconsistentPackages.length === 0) {
      console.log('✅ No inconsistent packages found!');
      return;
    }

    // Fix the country labeling
    console.log('🔧 Updating country names...');
    
    const { data: updatedPackages, error: updateError } = await supabase
      .from('my_packages')
      .update({ country_name: 'Europe & United States' })
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States')
      .select('*');

    if (updateError) {
      console.error('❌ Error updating packages:', updateError);
      return;
    }

    console.log(`✅ Successfully updated ${updatedPackages.length} packages!`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('name', 'Europe & United States eSIM Package')
      .neq('country_name', 'Europe & United States');

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    if (verifyPackages.length === 0) {
      console.log('✅ All "Europe & United States eSIM Package" entries now have correct country_name!');
    } else {
      console.log(`⚠️ Still ${verifyPackages.length} packages with incorrect labeling`);
    }

    // Show summary of all Europe & United States packages
    console.log('\n📋 Summary of Europe & United States packages:');
    const { data: allEuropeUS, error: summaryError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_name', 'Europe & United States')
      .order('data_amount', { ascending: true });

    if (summaryError) {
      console.error('❌ Error getting summary:', summaryError);
      return;
    }

    allEuropeUS.forEach(pkg => {
      console.log(`  - ${pkg.data_amount}GB - ${pkg.days} days - $${pkg.sale_price}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  fixCountryLabeling().then(() => {
    console.log('\n🎉 Country labeling fix completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixCountryLabeling }; 