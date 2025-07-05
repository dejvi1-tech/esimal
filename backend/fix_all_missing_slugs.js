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

/**
 * Generate a proper slug for a package based on its attributes
 */
function generateSlug(countryCode, days, dataAmount, planType = 'all') {
  // Handle null values with defaults
  const cleanCountryCode = countryCode?.toLowerCase() || 'global';
  const cleanDays = days || 30;
  const cleanDataAmount = Math.floor(dataAmount || 1);
  
  return `esim-${cleanCountryCode}-${cleanDays}days-${cleanDataAmount}gb-${planType}`;
}

/**
 * Fix all missing slugs in the my_packages table
 */
async function fixAllMissingSlugs() {
  console.log('🔧 Comprehensive Package Slug Fix - Preventing Webhook Failures\n');

  try {
    // Step 1: Get all packages with missing slugs
    console.log('📋 Step 1: Identifying packages with missing slugs...');
    const { data: packagesWithoutSlugs, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .or('slug.is.null,slug.eq.');

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    console.log(`📊 Found ${packagesWithoutSlugs.length} packages without slugs`);

    if (packagesWithoutSlugs.length === 0) {
      console.log('✅ All packages already have slugs - no fixes needed!');
      return;
    }

    // Step 2: Show what packages will be fixed
    console.log('\n📦 Packages that will be fixed:');
    packagesWithoutSlugs.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
    });

    // Step 3: Generate slugs for all packages
    console.log('\n🔧 Step 3: Generating slugs for all packages...');
    const packagesToUpdate = [];

    for (const pkg of packagesWithoutSlugs) {
      const newSlug = generateSlug(
        pkg.country_code,
        pkg.days,
        pkg.data_amount
      );
      
      packagesToUpdate.push({
        id: pkg.id,
        name: pkg.name,
        country_name: pkg.country_name,
        newSlug: newSlug
      });
      
      console.log(`   - ${pkg.name} (${pkg.country_name}) → ${newSlug}`);
    }

    // Step 4: Update packages in batches
    console.log('\n💾 Step 4: Updating packages with new slugs...');
    let successCount = 0;
    let errorCount = 0;

    for (const pkg of packagesToUpdate) {
      try {
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({ 
            slug: pkg.newSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`❌ Error updating package ${pkg.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${pkg.name} (${pkg.country_name}) → ${pkg.newSlug}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing package ${pkg.id}:`, error);
        errorCount++;
      }
    }

    // Step 5: Show summary
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} packages`);
    console.log(`   ❌ Errors: ${errorCount} packages`);
    console.log(`   📦 Total processed: ${packagesToUpdate.length} packages`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some packages had errors - please review the logs above');
    }

    // Step 6: Verify all packages now have slugs
    console.log('\n🔍 Step 6: Verifying all packages now have slugs...');
    const { data: remainingPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('id, name, country_name')
      .or('slug.is.null,slug.eq.');

    if (verifyError) {
      console.error('❌ Error verifying packages:', verifyError);
      return;
    }

    if (remainingPackages.length === 0) {
      console.log('✅ SUCCESS: All packages now have slugs!');
      console.log('📧 Webhook deliveries should now work properly.');
    } else {
      console.log(`⚠️ WARNING: ${remainingPackages.length} packages still missing slugs:`);
      remainingPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
      });
    }

    // Step 7: Show sample of fixed packages
    console.log('\n📋 Sample of fixed packages:');
    const { data: samplePackages, error: sampleError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, slug')
      .not('slug', 'is', null)
      .limit(10);

    if (!sampleError && samplePackages) {
      samplePackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}) → ${pkg.slug}`);
      });
    }

    // Step 8: Check for slug format consistency
    console.log('\n🔍 Step 8: Checking slug format consistency...');
    const { data: allPackages, error: allError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, slug')
      .not('slug', 'is', null);

    if (allError) {
      console.error('❌ Error checking all packages:', allError);
      return;
    }

    const properFormat = allPackages.filter(pkg => pkg.slug && pkg.slug.startsWith('esim-'));
    const improperFormat = allPackages.filter(pkg => pkg.slug && !pkg.slug.startsWith('esim-'));

    console.log(`   ✅ Packages with proper format: ${properFormat.length}`);
    console.log(`   ⚠️ Packages with improper format: ${improperFormat.length}`);

    if (improperFormat.length > 0) {
      console.log('\n📝 Packages with improper slug format:');
      improperFormat.slice(0, 5).forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} → ${pkg.slug}`);
      });
      if (improperFormat.length > 5) {
        console.log(`   ... and ${improperFormat.length - 5} more`);
      }
    }

    console.log('\n🎉 COMPLETE: Package slug fix process finished!');
    console.log('✅ Future webhook deliveries should now work properly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the comprehensive fix
fixAllMissingSlugs().catch(console.error); 