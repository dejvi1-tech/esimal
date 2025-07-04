const { createClient } = require('@supabase/supabase-js');

// Environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Working fallback packages for different regions
const WORKING_FALLBACK_PACKAGES = {
  'germany': 'esim-europe-30days-3gb-all',
  'deutschland': 'esim-europe-30days-3gb-all',
  'italy': 'esim-europe-30days-3gb-all',
  'france': 'esim-europe-30days-3gb-all',
  'spain': 'esim-europe-30days-3gb-all',
  'uk': 'esim-europe-30days-3gb-all',
  'united kingdom': 'esim-europe-30days-3gb-all',
  'europe': 'esim-europe-30days-3gb-all',
  'usa': 'esim-united-states-30days-3gb-all',
  'united states': 'esim-united-states-30days-3gb-all',
  'global': 'esim-global-30days-3gb-all',
  'asia': 'esim-asia-30days-3gb-all',
  'default': 'esim-europe-30days-3gb-all'
};

// Patterns of invalid auto-generated package IDs
const INVALID_PACKAGE_ID_PATTERNS = [
  /^esim-[a-z]{2,3}-\d+days-\d+gb-all$/,  // esim-de-30days-1gb-all
  /^esim-[a-z]{2,3}-\d+days-\d+\.?\d*gb-all$/  // esim-de-30days-1.5gb-all
];

async function fixExistingInvalidPackageIds() {
  console.log('🔧 Starting fix for existing packages with invalid auto-generated package IDs...\n');
  
  try {
    // Step 1: Get all packages with features.packageId
    const { data: packages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .not('features->packageId', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }
    
    console.log(`📦 Found ${packages.length} packages with package IDs\n`);
    
    let fixedCount = 0;
    let errorCount = 0;
    let validCount = 0;
    
    for (const pkg of packages) {
      const currentPackageId = pkg.features?.packageId;
      
      if (!currentPackageId) {
        continue;
      }
      
      // Check if this looks like an auto-generated invalid package ID
      const isInvalidPattern = INVALID_PACKAGE_ID_PATTERNS.some(pattern => 
        pattern.test(currentPackageId)
      );
      
      if (isInvalidPattern) {
        console.log(`🔄 Fixing package: ${pkg.name}`);
        console.log(`   Current invalid ID: ${currentPackageId}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        
        // Determine appropriate working fallback based on country
        let workingPackageId;
        const countryName = pkg.country_name?.toLowerCase() || '';
        const region = pkg.region?.toLowerCase() || '';
        
        // Smart mapping based on country/region
        if (countryName.includes('germany') || countryName.includes('deutschland')) {
          workingPackageId = WORKING_FALLBACK_PACKAGES.germany;
        } else if (countryName.includes('italy') || countryName.includes('italia')) {
          workingPackageId = WORKING_FALLBACK_PACKAGES.italy;
        } else if (countryName.includes('united states') || countryName.includes('usa')) {
          workingPackageId = WORKING_FALLBACK_PACKAGES.usa;
        } else if (region.includes('europe') || countryName.includes('france') || countryName.includes('spain')) {
          workingPackageId = WORKING_FALLBACK_PACKAGES.europe;
        } else if (region.includes('asia')) {
          workingPackageId = WORKING_FALLBACK_PACKAGES.asia;
        } else {
          workingPackageId = WORKING_FALLBACK_PACKAGES.default;
        }
        
        console.log(`   New working ID: ${workingPackageId}`);
        
        // Update package with working package ID
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({
            features: {
              ...pkg.features,
              packageId: workingPackageId,
              originalInvalidPackageId: currentPackageId, // Keep track for debugging
              fixedAt: new Date().toISOString(),
              fixReason: 'Replaced auto-generated invalid package ID with working Roamify package ID'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating package: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Package updated successfully`);
          fixedCount++;
        }
        
        console.log('');
      } else {
        // Package ID looks valid or is not auto-generated
        validCount++;
      }
    }
    
    console.log('=== SUMMARY ===');
    console.log(`✅ Fixed packages: ${fixedCount}`);
    console.log(`✅ Valid packages: ${validCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total packages checked: ${packages.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Package ID fixes completed!');
      console.log('Orders should now work without fallbacks!');
      console.log('\n📋 Next Steps:');
      console.log('1. Deploy the updated backend code');
      console.log('2. Test with a new order');
      console.log('3. Check logs to ensure no more fallbacks are needed');
    } else if (validCount === packages.length) {
      console.log('\n✅ All packages already have valid package IDs!');
    } else {
      console.log('\n⚠️ Some packages still need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
}

// Main execution
if (require.main === module) {
  fixExistingInvalidPackageIds().catch(console.error);
}

module.exports = { fixExistingInvalidPackageIds }; 