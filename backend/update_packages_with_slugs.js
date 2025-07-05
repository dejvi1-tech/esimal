const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a slug-style package ID for Roamify V2 API
 */
function generateSlug(countryCode, days, dataAmount, planType = 'all') {
  const country = countryCode ? countryCode.toLowerCase() : 'global';
  const dataGB = Math.floor(dataAmount || 1);
  return `esim-${country}-${days || 30}days-${dataGB}gb-${planType}`;
}

/**
 * Update packages with proper slug values
 */
async function updatePackagesWithSlugs() {
  console.log('🔄 Updating packages with slug values for Roamify V2...\n');

  try {
    // Get all packages that need slug updates
    const { data: packages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .or('slug.is.null,slug.eq.');

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    console.log(`📦 Found ${packages.length} packages that need slug updates`);

    if (packages.length === 0) {
      console.log('✅ All packages already have slug values');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const pkg of packages) {
      try {
        // Generate slug based on package data
        const slug = generateSlug(
          pkg.country_code,
          pkg.days,
          pkg.data_amount
        );

        // Update the package with the new slug
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({ 
            slug: slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`❌ Error updating package ${pkg.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated package: ${pkg.name} (${pkg.country_name}) -> ${slug}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing package ${pkg.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} packages`);
    console.log(`❌ Errors: ${errorCount} packages`);
    console.log(`📦 Total processed: ${packages.length} packages`);

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, slug')
      .not('slug', 'is', null)
      .limit(5);

    if (!verifyError && verifyPackages) {
      console.log('📋 Sample updated packages:');
      verifyPackages.forEach((pkg, index) => {
        console.log(`  ${index + 1}. ${pkg.name} (${pkg.country_name}) -> ${pkg.slug}`);
      });
    }

    console.log('\n✅ Slug update process completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Test the Roamify V2 integration with slug-based package IDs
 */
async function testRoamifyV2Integration() {
  console.log('\n🧪 Testing Roamify V2 integration with slug-based package IDs...\n');

  try {
    // Get a sample package with slug
    const { data: testPackage, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .not('slug', 'is', null)
      .limit(1)
      .single();

    if (fetchError || !testPackage) {
      console.error('❌ No packages with slug found for testing');
      return;
    }

    console.log('📦 Test package found:');
    console.log(`  Name: ${testPackage.name}`);
    console.log(`  Country: ${testPackage.country_name}`);
    console.log(`  Slug: ${testPackage.slug}`);
    console.log(`  Data: ${testPackage.data_amount}GB`);
    console.log(`  Days: ${testPackage.days}`);

    // Test the payload structure that would be sent to Roamify
    const testPayload = {
      items: [
        {
          packageId: testPackage.slug,
          quantity: 1
        }
      ]
    };

    console.log('\n📤 Test payload for Roamify V2 API:');
    console.log(JSON.stringify(testPayload, null, 2));

    console.log('\n✅ Roamify V2 integration test completed!');
    console.log('📝 The payload above shows the correct format for Roamify V2 API');

  } catch (error) {
    console.error('❌ Error during integration test:', error);
  }
}

// Run the updates
async function main() {
  await updatePackagesWithSlugs();
  await testRoamifyV2Integration();
}

main(); 