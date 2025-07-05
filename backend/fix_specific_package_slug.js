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

// The specific package ID that's failing
const FAILING_PACKAGE_ID = 'f6315d94-55d7-4402-9637-968cb54cb74c';

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
 * Fix the specific package that's causing webhook failures
 */
async function fixSpecificPackageSlug() {
  console.log('🔧 Fixing specific package slug for webhook delivery...\n');
  console.log(`📦 Target package ID: ${FAILING_PACKAGE_ID}`);

  try {
    // Step 1: Get the specific package details
    console.log('📋 Step 1: Fetching package details...');
    const { data: packageData, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', FAILING_PACKAGE_ID)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching package:', fetchError);
      return;
    }

    if (!packageData) {
      console.error('❌ Package not found in database');
      return;
    }

    console.log('✅ Package found:');
    console.log(`   - ID: ${packageData.id}`);
    console.log(`   - Name: ${packageData.name}`);
    console.log(`   - Country: ${packageData.country_name} (${packageData.country_code})`);
    console.log(`   - Data: ${packageData.data_amount}GB`);
    console.log(`   - Days: ${packageData.days}`);
    console.log(`   - Current slug: ${packageData.slug || 'NULL'}`);
    console.log(`   - Has slug: ${!!packageData.slug}`);

    // Step 2: Check if slug is missing or invalid
    if (!packageData.slug || packageData.slug.trim() === '') {
      console.log('\n🔍 Step 2: Slug is missing - will generate a new one');
      
      // Generate a proper slug
      const newSlug = generateSlug(
        packageData.country_code,
        packageData.days,
        packageData.data_amount
      );
      
      console.log(`📝 Generated new slug: ${newSlug}`);
      
      // Step 3: Update the package with the new slug
      console.log('\n💾 Step 3: Updating package with new slug...');
      const { error: updateError } = await supabase
        .from('my_packages')
        .update({ 
          slug: newSlug,
          updated_at: new Date().toISOString()
        })
        .eq('id', FAILING_PACKAGE_ID);

      if (updateError) {
        console.error('❌ Error updating package:', updateError);
        return;
      }

      console.log('✅ Package updated successfully!');
      console.log(`   - New slug: ${newSlug}`);
      
      // Step 4: Verify the update
      console.log('\n🔍 Step 4: Verifying the update...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('my_packages')
        .select('id, name, slug, country_name, data_amount, days')
        .eq('id', FAILING_PACKAGE_ID)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError);
        return;
      }

      console.log('✅ Verification successful:');
      console.log(`   - ID: ${verifyData.id}`);
      console.log(`   - Name: ${verifyData.name}`);
      console.log(`   - Slug: ${verifyData.slug}`);
      console.log(`   - Country: ${verifyData.country_name}`);
      console.log(`   - Data: ${verifyData.data_amount}GB`);
      console.log(`   - Days: ${verifyData.days}`);
      
      console.log('\n🎉 SUCCESS: Package slug has been fixed!');
      console.log('📧 The webhook should now be able to deliver eSIMs for this package.');
      
    } else {
      console.log('\n✅ Package already has a slug - checking if it needs updating...');
      
      // Check if the current slug follows the expected format
      const expectedSlug = generateSlug(
        packageData.country_code,
        packageData.days,
        packageData.data_amount
      );
      
      if (packageData.slug !== expectedSlug) {
        console.log(`⚠️ Current slug doesn't match expected format:`);
        console.log(`   - Current: ${packageData.slug}`);
        console.log(`   - Expected: ${expectedSlug}`);
        
        // Ask if we should update it
        console.log('\n💾 Updating to standardized format...');
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({ 
            slug: expectedSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', FAILING_PACKAGE_ID);

        if (updateError) {
          console.error('❌ Error updating package:', updateError);
          return;
        }

        console.log('✅ Package slug updated to standardized format!');
        console.log(`   - New slug: ${expectedSlug}`);
      } else {
        console.log('✅ Package slug is already in correct format');
      }
    }

    // Step 5: Test if other packages are missing slugs
    console.log('\n🔍 Step 5: Checking for other packages with missing slugs...');
    const { data: packagesWithoutSlugs, error: checkError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, days')
      .or('slug.is.null,slug.eq.')
      .limit(10);

    if (checkError) {
      console.error('❌ Error checking other packages:', checkError);
      return;
    }

    if (packagesWithoutSlugs && packagesWithoutSlugs.length > 0) {
      console.log(`⚠️ Found ${packagesWithoutSlugs.length} other packages without slugs:`);
      packagesWithoutSlugs.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
      });
      console.log('\n💡 Consider running a global slug fix to prevent future webhook failures.');
    } else {
      console.log('✅ All other packages have slugs - no other issues found.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixSpecificPackageSlug().catch(console.error); 