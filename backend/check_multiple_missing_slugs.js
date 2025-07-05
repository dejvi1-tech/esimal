const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The package IDs that have failed in webhooks
const FAILING_PACKAGE_IDS = [
  'f6315d94-55d7-4402-9637-968cb54cb74c', // First failing package (1 GB - 30 days)
  '950758a4-09b9-426a-9fc0-4b9a401afe88'  // Second failing package (3 GB - 30 days)
];

/**
 * Check multiple packages with missing slugs
 */
async function checkMultipleMissingSlugs() {
  console.log('🔍 Checking Multiple Packages with Missing Slugs\n');
  console.log('This script checks the specific packages that have failed in webhooks');
  console.log('and identifies how many total packages are missing slugs.\n');

  try {
    // Step 1: Check the specific failing packages
    console.log('📦 Step 1: Checking specific failing packages...\n');

    for (const packageId of FAILING_PACKAGE_IDS) {
      console.log(`--- Checking package: ${packageId} ---`);
      
      const { data: packageData, error: fetchError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (fetchError) {
        console.error(`❌ Error fetching package ${packageId}:`, fetchError);
        continue;
      }

      if (!packageData) {
        console.error(`❌ Package ${packageId} not found in database`);
        continue;
      }

      console.log(`✅ Package found: ${packageData.name}`);
      console.log(`   - Country: ${packageData.country_name} (${packageData.country_code})`);
      console.log(`   - Data: ${packageData.data_amount}GB, Days: ${packageData.days}`);
      console.log(`   - Slug: ${packageData.slug || '❌ MISSING'}`);
      console.log(`   - Status: ${packageData.slug ? '✅ HAS SLUG' : '❌ MISSING SLUG - CAUSING WEBHOOK FAILURE'}`);
      console.log('');
    }

    // Step 2: Count total packages with missing slugs
    console.log('📊 Step 2: Counting total packages with missing slugs...\n');

    const { data: missingSlugsCount, error: countError } = await supabase
      .from('my_packages')
      .select('id', { count: 'exact' })
      .or('slug.is.null,slug.eq.');

    if (countError) {
      console.error('❌ Error counting packages with missing slugs:', countError);
      return;
    }

    console.log(`📈 Total packages with missing slugs: ${missingSlugsCount.length}`);

    // Step 3: Show sample of packages with missing slugs
    console.log('\n📋 Step 3: Sample packages with missing slugs...\n');

    const { data: sampleMissing, error: sampleError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days')
      .or('slug.is.null,slug.eq.')
      .limit(10);

    if (sampleError) {
      console.error('❌ Error fetching sample packages:', sampleError);
      return;
    }

    if (sampleMissing.length > 0) {
      console.log('Here are some examples of packages without slugs:');
      sampleMissing.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
      });
      
      if (missingSlugsCount.length > 10) {
        console.log(`   ... and ${missingSlugsCount.length - 10} more packages`);
      }
    }

    // Step 4: Check total packages in database
    console.log('\n📊 Step 4: Database overview...\n');

    const { data: totalCount, error: totalError } = await supabase
      .from('my_packages')
      .select('id', { count: 'exact' });

    if (!totalError) {
      const totalPackages = totalCount.length;
      const packagesWithSlugs = totalPackages - missingSlugsCount.length;
      const coverage = ((packagesWithSlugs / totalPackages) * 100).toFixed(1);

      console.log(`📦 Total packages in database: ${totalPackages}`);
      console.log(`✅ Packages with slugs: ${packagesWithSlugs}`);
      console.log(`❌ Packages without slugs: ${missingSlugsCount.length}`);
      console.log(`📈 Slug coverage: ${coverage}%`);
    }

    // Step 5: Urgency assessment
    console.log('\n🚨 Step 5: Urgency Assessment...\n');

    if (missingSlugsCount.length === 0) {
      console.log('🎉 GOOD NEWS: All packages have slugs!');
      console.log('   No immediate action needed.');
    } else if (missingSlugsCount.length <= 5) {
      console.log('⚠️ LOW URGENCY: Few packages missing slugs');
      console.log('   You can fix these individually or run the comprehensive fix.');
    } else if (missingSlugsCount.length <= 20) {
      console.log('🔶 MEDIUM URGENCY: Several packages missing slugs');
      console.log('   Recommended to run the comprehensive fix soon.');
    } else {
      console.log('🔴 HIGH URGENCY: Many packages missing slugs');
      console.log('   Multiple webhook failures likely. Run comprehensive fix immediately.');
    }

    // Step 6: Recommendations
    console.log('\n💡 Recommendations:\n');

    if (missingSlugsCount.length > 0) {
      console.log('1. 🚀 IMMEDIATE FIX: Run the comprehensive SQL script');
      console.log('   Copy and paste this into your Supabase SQL editor:');
      console.log('   backend/fix_all_countries_greece_format.sql');
      console.log('');
      console.log('2. 🎯 ALTERNATIVE: Run Node.js script');
      console.log('   cd backend && node fix_all_missing_slugs.js');
      console.log('');
      console.log('3. 🔍 VERIFY: After fixing, test webhook with these packages:');
      FAILING_PACKAGE_IDS.forEach(id => {
        console.log(`   - ${id}`);
      });
    }

    console.log('\n📋 Summary:');
    console.log(`   - Webhook failures detected: ${FAILING_PACKAGE_IDS.length} packages`);
    console.log(`   - Total packages missing slugs: ${missingSlugsCount.length}`);
    console.log(`   - Immediate action needed: ${missingSlugsCount.length > 0 ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkMultipleMissingSlugs().catch(console.error); 