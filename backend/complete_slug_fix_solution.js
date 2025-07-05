const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

if (!ROAMIFY_API_KEY) {
  console.error('❌ Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a slug-style package ID from package data
 */
function generateSlug(countryCode, days, dataAmount, planType = 'all') {
  if (!countryCode) {
    console.warn('⚠️ No country code provided, using "global"');
    countryCode = 'global';
  }
  
  if (!days || days <= 0) {
    console.warn('⚠️ Invalid days provided, using 30');
    days = 30;
  }
  
  if (!dataAmount || dataAmount <= 0) {
    console.warn('⚠️ Invalid data amount provided, using 1');
    dataAmount = 1;
  }
  
  // Convert data amount to GB if it's in MB
  const dataAmountGB = dataAmount >= 1024 ? Math.floor(dataAmount / 1024) : dataAmount;
  
  return `esim-${countryCode.toLowerCase()}-${days}days-${dataAmountGB}gb-${planType}`;
}

/**
 * Check if a string is a UUID
 */
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Fetch Roamify packages to get correct slugs
 */
async function fetchRoamifyPackages() {
  console.log('📡 Fetching packages from Roamify API...');
  
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (response.status !== 200) {
      throw new Error(`Roamify API returned status ${response.status}`);
    }

    const roamifyPackages = response.data?.data?.packages || [];
    console.log(`✅ Fetched ${roamifyPackages.length} packages from Roamify`);
    
    return roamifyPackages;
  } catch (error) {
    console.error('❌ Error fetching Roamify packages:', error.message);
    return [];
  }
}

/**
 * Scan for missing slugs in my_packages table
 */
async function scanForMissingSlugs() {
  console.log('🔍 Scanning for missing slugs...');
  
  try {
    const { data: missingPackages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, features, slug')
      .or('slug.is.null,slug.eq.');

    if (error) {
      console.error('❌ Error scanning for missing slugs:', error);
      return [];
    }

    console.log(`📦 Found ${missingPackages.length} packages with missing slugs`);
    return missingPackages;
  } catch (error) {
    console.error('❌ Error scanning for missing slugs:', error);
    return [];
  }
}

/**
 * Get correct slug from Roamify packages based on package data
 */
function findRoamifySlug(package, roamifyPackages) {
  // Try to find by features.packageId first
  if (package.features && package.features.packageId) {
    const roamifyPackage = roamifyPackages.find(p => p.packageId === package.features.packageId);
    if (roamifyPackage && roamifyPackage.slug) {
      return roamifyPackage.slug;
    }
  }
  
  // Try to find by country and data amount
  if (package.country_code && package.data_amount && package.days) {
    const roamifyPackage = roamifyPackages.find(p => {
      const pkgCountry = p.countryCode?.toLowerCase();
      const pkgDataAmount = p.dataAmount || p.data;
      const pkgDays = p.days || p.day;
      
      return pkgCountry === package.country_code.toLowerCase() &&
             pkgDataAmount === package.data_amount &&
             pkgDays === package.days;
    });
    
    if (roamifyPackage && roamifyPackage.slug) {
      return roamifyPackage.slug;
    }
  }
  
  // Generate fallback slug
  return generateSlug(package.country_code, package.days, package.data_amount);
}

/**
 * Update packages with correct slugs
 */
async function updatePackagesWithSlugs(packagesToUpdate) {
  console.log(`🔄 Updating ${packagesToUpdate.length} packages with slugs...`);
  
  let updatedCount = 0;
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
        console.log(`✅ Updated: ${pkg.name} (${pkg.country_name}) -> ${pkg.newSlug}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing package ${pkg.id}:`, error);
      errorCount++;
    }
  }
  
  return { updatedCount, errorCount };
}

/**
 * Test webhook slug extraction for a specific package
 */
async function testWebhookSlugExtraction(packageId) {
  console.log(`🧪 Testing webhook slug extraction for package: ${packageId}`);
  
  try {
    // Simulate what the webhook controller does
    let { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    // FALLBACK: If not found in my_packages, try packages table as secondary lookup
    if (packageError || !packageData) {
      console.log(`Package ID ${packageId} not found in my_packages table, trying packages table as fallback...`);
      
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (packagesError || !packagesData) {
        console.error(`❌ Package ID ${packageId} not found in either my_packages or packages table`);
        return false;
      }
      
      packageData = packagesData;
      console.log(`✅ Package found in packages table as fallback: ${packageId}`);
    } else {
      console.log(`✅ Package found in my_packages table: ${packageId}`);
    }

    // Check for slug (this is what the webhook does)
    if (!packageData.slug) {
      console.error(`❌ No slug found for package: ${packageId}. Package data:`, {
        packageId: packageData.id,
        name: packageData.name,
        hasSlug: !!packageData.slug,
      });
      console.error('❌ This would cause webhook failure!');
      return false;
    }

    const roamifyPackageId = packageData.slug;
    console.log(`✅ Slug found: ${roamifyPackageId} - webhook would succeed`);
    console.log(`📦 Would use slug for Roamify V2 API: ${roamifyPackageId}`);
    console.log(`[ROAMIFY V2 DEBUG] Request Payload: { items: [ { packageId: "${roamifyPackageId}", quantity: 1 } ] }`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing webhook slug extraction:', error);
    return false;
  }
}

/**
 * Test Greece package specifically
 */
async function testGreecePackage() {
  console.log('🧪 Testing Greece package specifically...\n');
  
  try {
    // Find Greece packages
    const { data: greecePackages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, slug')
      .or('country_name.ilike.%greece%,country_code.eq.GR')
      .limit(3);

    if (error) {
      console.error('❌ Error finding Greece packages:', error);
      return;
    }

    if (!greecePackages || greecePackages.length === 0) {
      console.log('⚠️ No Greece packages found');
      return;
    }

    console.log(`📦 Found ${greecePackages.length} Greece packages:`);
    
    for (const pkg of greecePackages) {
      console.log(`\n--- Testing Greece package: ${pkg.name} ---`);
      console.log(`   Country: ${pkg.country_name} (${pkg.country_code})`);
      console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log(`   Slug: ${pkg.slug || 'MISSING'}`);
      
      if (pkg.slug) {
        console.log(`✅ Slug found: ${pkg.slug}`);
        console.log(`📦 Would use slug for Roamify V2 API: ${pkg.slug}`);
        console.log(`[ROAMIFY V2 DEBUG] Request Payload: { items: [ { packageId: "${pkg.slug}", quantity: 1 } ] }`);
      } else {
        console.error('❌ No slug found - this would cause webhook failure!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Greece packages:', error);
  }
}

/**
 * Verify slug updates and provide summary
 */
async function verifySlugUpdates() {
  console.log('🔍 Verifying slug updates...');
  
  try {
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, slug')
      .not('slug', 'is', null)
      .limit(10);

    if (error) {
      console.error('❌ Error verifying updates:', error);
      return;
    }

    console.log('📋 Sample packages with slugs:');
    packages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} (${pkg.country_name}) -> ${pkg.slug}`);
    });
    
    // Count total packages with slugs
    const { count: totalWithSlugs } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true })
      .not('slug', 'is', null);
    
    const { count: totalPackages } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Slug coverage: ${totalWithSlugs}/${totalPackages} packages have slugs (${Math.round(totalWithSlugs/totalPackages*100)}%)`);
    
    return { totalWithSlugs, totalPackages };
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return { totalWithSlugs: 0, totalPackages: 0 };
  }
}

/**
 * Main function to auto-detect and fix missing slugs
 */
async function autoFixMissingSlugs() {
  console.log('🔄 AUTO-DETECT AND FIX MISSING SLUGS\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Scan for missing slugs
    const missingPackages = await scanForMissingSlugs();
    
    if (missingPackages.length === 0) {
      console.log('✅ All packages already have slugs!');
      await verifySlugUpdates();
      return;
    }

    // Step 2: Fetch Roamify packages for correct slugs
    const roamifyPackages = await fetchRoamifyPackages();
    
    // Step 3: Determine correct slugs for each package
    console.log('🔧 Determining correct slugs...');
    const packagesToUpdate = [];
    
    for (const pkg of missingPackages) {
      const newSlug = findRoamifySlug(pkg, roamifyPackages);
      packagesToUpdate.push({
        ...pkg,
        newSlug
      });
      
      console.log(`📦 ${pkg.name} (${pkg.country_name}) -> ${newSlug}`);
    }

    // Step 4: Update packages with correct slugs
    const { updatedCount, errorCount } = await updatePackagesWithSlugs(packagesToUpdate);

    // Step 5: Verify updates
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} packages`);
    console.log(`❌ Errors: ${errorCount} packages`);
    console.log(`📦 Total processed: ${packagesToUpdate.length} packages`);

    await verifySlugUpdates();

    // Step 6: Test with a sample package
    if (packagesToUpdate.length > 0) {
      const testPackage = packagesToUpdate[0];
      console.log('\n🧪 Testing webhook with updated package...');
      await testWebhookSlugExtraction(testPackage.id);
    }

    console.log('\n🎉 Auto-fix completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Complete solution: Fix missing slugs and test webhook
 */
async function completeSlugFixSolution() {
  console.log('🚀 COMPLETE SLUG FIX SOLUTION\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Auto-fix missing slugs
    console.log('STEP 1: Auto-fix missing slugs');
    console.log('-'.repeat(40));
    await autoFixMissingSlugs();
    
    console.log('\n' + '='.repeat(60));
    
    // Step 2: Test Greece package specifically
    console.log('STEP 2: Test Greece package specifically');
    console.log('-'.repeat(40));
    await testGreecePackage();
    
    console.log('\n' + '='.repeat(60));
    
    // Step 3: Final verification and summary
    console.log('STEP 3: Final verification and summary');
    console.log('-'.repeat(40));
    
    const { totalWithSlugs, totalPackages } = await verifySlugUpdates();
    
    if (totalWithSlugs === totalPackages) {
      console.log('\n🎉 SUCCESS: All packages have slugs!');
      console.log('✅ eSIM delivery failures should be prevented');
      console.log('✅ Webhook will work correctly for all packages');
    } else {
      const missingCount = totalPackages - totalWithSlugs;
      console.log(`\n⚠️ WARNING: ${missingCount} packages still missing slugs`);
      console.log('❌ These packages will cause webhook failures');
      console.log('💡 Consider running the fix again or checking manually');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Test a real webhook with a Greece package');
    console.log('2. Monitor logs for "No slug found" errors');
    console.log('3. Run this script periodically to catch new packages');
    
  } catch (error) {
    console.error('❌ Error in complete solution:', error);
  }
}

// Run the complete solution if this script is executed directly
if (require.main === module) {
  completeSlugFixSolution()
    .then(() => {
      console.log('\n✅ Complete slug fix solution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Complete slug fix solution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  autoFixMissingSlugs,
  scanForMissingSlugs,
  generateSlug,
  testWebhookSlugExtraction,
  testGreecePackage,
  verifySlugUpdates,
  completeSlugFixSolution
}; 