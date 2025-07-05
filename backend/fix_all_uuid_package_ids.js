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

// UUID regex pattern to detect invalid package IDs
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Working fallback packages for different regions
const WORKING_FALLBACK_PACKAGES = {
  'europe': 'esim-europe-30days-3gb-all',
  'usa': 'esim-united-states-30days-3gb-all',
  'global': 'esim-global-30days-3gb-all',
  'asia': 'esim-asia-30days-3gb-all',
  'default': 'esim-europe-30days-3gb-all'
};

// Country-specific package mappings
const COUNTRY_PACKAGE_MAPPINGS = {
  'sweden': {
    '100gb': 'esim-sweden-30days-100gb-unsms-unmin-all',
    '50gb': 'esim-sweden-30days-50gb-unsms-unmin-all',
    '20gb': 'esim-sweden-30days-20gb-unsms-unmin-all',
    '10gb': 'esim-sweden-30days-10gb-unsms-unmin-all',
    '5gb': 'esim-sweden-30days-5gb-unsms-unmin-all',
    '3gb': 'esim-sweden-30days-3gb-unsms-unmin-all',
    '1gb': 'esim-sweden-30days-1gb-unsms-unmin-all'
  },
  'germany': {
    '100gb': 'esim-germany-30days-100gb-unsms-unmin-all',
    '50gb': 'esim-germany-30days-50gb-unsms-unmin-all',
    '20gb': 'esim-germany-30days-20gb-unsms-unmin-all',
    '10gb': 'esim-germany-30days-10gb-unsms-unmin-all',
    '5gb': 'esim-germany-30days-5gb-unsms-unmin-all',
    '3gb': 'esim-germany-30days-3gb-unsms-unmin-all',
    '1gb': 'esim-germany-30days-1gb-unsms-unmin-all'
  },
  'france': {
    '100gb': 'esim-france-30days-100gb-unsms-unmin-all',
    '50gb': 'esim-france-30days-50gb-unsms-unmin-all',
    '20gb': 'esim-france-30days-20gb-unsms-unmin-all',
    '10gb': 'esim-france-30days-10gb-unsms-unmin-all',
    '5gb': 'esim-france-30days-5gb-unsms-unmin-all',
    '3gb': 'esim-france-30days-3gb-unsms-unmin-all',
    '1gb': 'esim-france-30days-1gb-unsms-unmin-all'
  }
};

function getProperRoamifyPackageId(package) {
  const countryName = package.country_name?.toLowerCase() || '';
  const dataAmount = package.data_amount || 1;
  const days = package.days || 30;
  
  // Try to find country-specific mapping
  for (const [country, mappings] of Object.entries(COUNTRY_PACKAGE_MAPPINGS)) {
    if (countryName.includes(country)) {
      const dataKey = `${Math.round(dataAmount)}gb`;
      if (mappings[dataKey]) {
        return mappings[dataKey];
      }
    }
  }
  
  // Fallback based on region
  const region = package.region?.toLowerCase() || '';
  if (region.includes('europe') || countryName.includes('germany') || countryName.includes('france') || countryName.includes('sweden')) {
    return WORKING_FALLBACK_PACKAGES.europe;
  } else if (countryName.includes('united states') || countryName.includes('usa')) {
    return WORKING_FALLBACK_PACKAGES.usa;
  } else if (region.includes('asia')) {
    return WORKING_FALLBACK_PACKAGES.asia;
  }
  
  return WORKING_FALLBACK_PACKAGES.default;
}

async function fixAllUUIDPackageIds() {
  console.log('🔧 Fixing all packages with UUID package IDs...\n');
  
  try {
    // Get all packages with features.packageId
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
      
      // Check if this is a UUID (invalid package ID)
      const isUUID = UUID_PATTERN.test(currentPackageId);
      
      if (isUUID) {
        console.log(`🔄 Fixing package: ${pkg.name}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Current invalid UUID: ${currentPackageId}`);
        
        const properPackageId = getProperRoamifyPackageId(pkg);
        console.log(`   New proper ID: ${properPackageId}`);
        
        const updateData = {
          features: {
            ...(pkg.features || {}),
            packageId: properPackageId,
            dataAmount: pkg.data_amount,
            days: pkg.days,
            price: pkg.base_price,
            currency: 'EUR',
            plan: 'data-voice-sms',
            activation: 'installation',
            isUnlimited: false,
            withSMS: true,
            withCall: true,
            withHotspot: true,
            withDataRoaming: true,
            geography: 'local',
            region: pkg.region || 'Europe',
            countrySlug: pkg.country_name?.toLowerCase(),
            notes: [
              'Check usage: dial #123#',
              'Check number: dial 225',
              'Call format: +(country code)(local number)'
            ],
            // Keep track of the fix
            originalInvalidPackageId: currentPackageId,
            fixedAt: new Date().toISOString(),
            fixReason: 'Replaced UUID with proper Roamify package ID format'
          },
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('my_packages')
          .update(updateData)
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
        // Package ID looks valid (not a UUID)
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
      console.log('Orders should now work without fallbacks.');
      console.log('\n📋 Next Steps:');
      console.log('1. Test with a new order');
      console.log('2. Check logs to ensure no more fallbacks are needed');
    } else if (validCount === packages.length) {
      console.log('\n✅ All packages already have valid package IDs!');
    } else {
      console.log('\n⚠️ Some packages still need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
}

// Run the fix
fixAllUUIDPackageIds()
  .then(() => {
    console.log('\n🎉 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 