const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
 * Find packages with missing slugs
 */
async function findPackagesWithMissingSlugs() {
  console.log('🔍 Finding packages with missing slugs...');
  
  try {
    const { data: missingPackages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, slug')
      .or('slug.is.null,slug.eq.');

    if (error) {
      console.error('❌ Error finding packages with missing slugs:', error);
      return [];
    }

    console.log(`📦 Found ${missingPackages.length} packages with missing slugs`);
    return missingPackages;
  } catch (error) {
    console.error('❌ Error finding packages with missing slugs:', error);
    return [];
  }
}

/**
 * Find packages with valid slugs
 */
async function findPackagesWithValidSlugs(limit = 5) {
  console.log(`🔍 Finding packages with valid slugs (limit: ${limit})...`);
  
  try {
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, slug')
      .not('slug', 'is', null)
      .limit(limit);

    if (error) {
      console.error('❌ Error finding packages with valid slugs:', error);
      return [];
    }

    console.log(`📦 Found ${packages.length} packages with valid slugs`);
    return packages;
  } catch (error) {
    console.error('❌ Error finding packages with valid slugs:', error);
    return [];
  }
}

/**
 * Test multiple packages
 */
async function testMultiplePackages() {
  console.log('🧪 Testing multiple packages...\n');
  
  // Test packages with valid slugs
  const validPackages = await findPackagesWithValidSlugs(3);
  let successCount = 0;
  
  for (const pkg of validPackages) {
    console.log(`\n--- Testing package: ${pkg.name} (${pkg.country_name}) ---`);
    const success = await testWebhookSlugExtraction(pkg.id);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Test Results: ${successCount}/${validPackages.length} packages would work with webhook`);
  
  // Test packages with missing slugs
  const missingPackages = await findPackagesWithMissingSlugs();
  if (missingPackages.length > 0) {
    console.log(`\n⚠️ Found ${missingPackages.length} packages with missing slugs that would cause webhook failures:`);
    missingPackages.slice(0, 3).forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
    });
    
    if (missingPackages.length > 3) {
      console.log(`  ... and ${missingPackages.length - 3} more`);
    }
  }
}

/**
 * Test specific Greece package (as mentioned in the user's request)
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
 * Run comprehensive tests
 */
async function runTests() {
  console.log('🧪 WEBHOOK SLUG FIX TESTING\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Multiple packages
    await testMultiplePackages();
    
    console.log('\n' + '='.repeat(60));
    
    // Test 2: Greece package specifically
    await testGreecePackage();
    
    console.log('\n' + '='.repeat(60));
    
    // Test 3: Summary
    console.log('📊 SUMMARY');
    
    const { count: totalPackages } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true });
    
    const { count: packagesWithSlugs } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true })
      .not('slug', 'is', null);
    
    const { count: packagesWithoutSlugs } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true })
      .or('slug.is.null,slug.eq.');
    
    console.log(`📦 Total packages: ${totalPackages}`);
    console.log(`✅ Packages with slugs: ${packagesWithSlugs}`);
    console.log(`❌ Packages without slugs: ${packagesWithoutSlugs}`);
    console.log(`📊 Slug coverage: ${Math.round(packagesWithSlugs/totalPackages*100)}%`);
    
    if (packagesWithoutSlugs > 0) {
      console.log(`\n⚠️ ${packagesWithoutSlugs} packages still need slug fixes to prevent webhook failures`);
      console.log('💡 Run the auto_fix_missing_slugs.js script to fix them automatically');
    } else {
      console.log('\n🎉 All packages have slugs! Webhook failures should be prevented.');
    }
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Webhook slug testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Webhook slug testing failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testWebhookSlugExtraction,
  findPackagesWithMissingSlugs,
  findPackagesWithValidSlugs,
  testMultiplePackages,
  testGreecePackage,
  runTests
}; 