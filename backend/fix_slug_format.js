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
 * Check if a string is a UUID
 */
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Fix slug format from UUID to proper slug-style
 */
async function fixSlugFormat() {
  console.log('🔄 Fixing slug format from UUID to slug-style for Roamify V2...\n');

  try {
    // Get all packages with slug values
    const { data: packages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .not('slug', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    console.log(`📦 Found ${packages.length} packages with slug values`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pkg of packages) {
      try {
        // Check if current slug is a UUID
        if (isUUID(pkg.slug)) {
          // Generate proper slug-style ID
          const newSlug = generateSlug(
            pkg.country_code,
            pkg.days,
            pkg.data_amount
          );

          // Update the package with the new slug
          const { error: updateError } = await supabase
            .from('my_packages')
            .update({ 
              slug: newSlug,
              updated_at: new Date().toISOString()
            })
            .eq('id', pkg.id);

          if (updateError) {
            console.error(`❌ Error updating package ${pkg.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Fixed slug: ${pkg.name} (${pkg.country_name})`);
            console.log(`   Old: ${pkg.slug}`);
            console.log(`   New: ${newSlug}`);
            updatedCount++;
          }
        } else {
          // Skip if already in correct format
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing package ${pkg.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} packages`);
    console.log(`⏭️  Skipped (already correct): ${skippedCount} packages`);
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
      console.log('📋 Sample packages after fix:');
      verifyPackages.forEach((pkg, index) => {
        console.log(`  ${index + 1}. ${pkg.name} (${pkg.country_name}) -> ${pkg.slug}`);
      });
    }

    console.log('\n✅ Slug format fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Test the Roamify V2 integration with proper slug-style package IDs
 */
async function testRoamifyV2Integration() {
  console.log('\n🧪 Testing Roamify V2 integration with proper slug-style package IDs...\n');

  try {
    // Get a sample package with proper slug
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

    // Check if the slug is in the correct format
    if (testPackage.slug.startsWith('esim-')) {
      console.log('\n✅ Slug is in correct format for Roamify V2!');
    } else {
      console.log('\n⚠️  Slug may not be in the correct format for Roamify V2');
    }

    console.log('\n✅ Roamify V2 integration test completed!');

  } catch (error) {
    console.error('❌ Error during integration test:', error);
  }
}

// Run the fixes
async function main() {
  await fixSlugFormat();
  await testRoamifyV2Integration();
}

main(); 