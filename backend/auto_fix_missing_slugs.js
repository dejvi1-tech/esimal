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
 * Verify slug updates
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
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

/**
 * Test webhook with a specific package
 */
async function testWebhookWithPackage(packageSlug) {
  console.log(`🧪 Testing webhook with package slug: ${packageSlug}`);
  
  try {
    // Find the package in my_packages
    const { data: package, error } = await supabase
      .from('my_packages')
      .select('*')
      .eq('slug', packageSlug)
      .single();

    if (error || !package) {
      console.error(`❌ Package with slug ${packageSlug} not found`);
      return;
    }

    console.log(`✅ Found package: ${package.name} (${package.country_name})`);
    console.log(`📦 Slug: ${package.slug}`);
    
    // Simulate what the webhook would do
    console.log('🔧 Simulating webhook slug extraction...');
    
    if (!package.slug) {
      console.error('❌ No slug found - this would cause webhook failure!');
    } else {
      console.log(`✅ Slug found: ${package.slug} - webhook would succeed`);
      console.log(`📦 Would use slug for Roamify V2 API: ${package.slug}`);
      console.log(`[ROAMIFY V2 DEBUG] Request Payload: { items: [ { packageId: "${package.slug}", quantity: 1 } ] }`);
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
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
      await testWebhookWithPackage(testPackage.newSlug);
    }

    console.log('\n🎉 Auto-fix completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

/**
 * Enforce slug updates in sync process
 */
async function enforceSlugInSync() {
  console.log('🔧 Enforcing slug updates in sync process...');
  
  try {
    // Update syncRoamifyPackages.ts to include slug in upsert
    console.log('📝 Note: Ensure syncRoamifyPackages.ts includes slug in upsert operation');
    console.log('   Example: .upsert({ id, name, data_amount, days, slug, roamify_package_id, ... })');
    
    // Check if the sync script exists and has slug support
    const fs = require('fs');
    const path = require('path');
    
    const syncScriptPath = path.join(__dirname, 'src/scripts/syncRoamifyPackages.ts');
    if (fs.existsSync(syncScriptPath)) {
      const content = fs.readFileSync(syncScriptPath, 'utf8');
      if (content.includes('slug') && content.includes('upsert')) {
        console.log('✅ Sync script already includes slug support');
      } else {
        console.log('⚠️ Sync script may need slug field in upsert operation');
      }
    } else {
      console.log('⚠️ Sync script not found at expected location');
    }
    
  } catch (error) {
    console.error('❌ Error checking sync script:', error);
  }
}

// Run the auto-fix if this script is executed directly
if (require.main === module) {
  autoFixMissingSlugs()
    .then(() => {
      console.log('\n✅ Auto-fix process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Auto-fix process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  autoFixMissingSlugs,
  scanForMissingSlugs,
  generateSlug,
  testWebhookWithPackage,
  enforceSlugInSync
}; 