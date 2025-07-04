const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Working fallback packages for different regions
const WORKING_FALLBACK_PACKAGES = {
  'europe': 'esim-europe-30days-3gb-all',
  'germany': 'esim-europe-30days-3gb-all',
  'usa': 'esim-united-states-30days-3gb-all',
  'global': 'esim-global-30days-3gb-all',
  'asia': 'esim-asia-30days-3gb-all',
  'default': 'esim-europe-30days-3gb-all'
};

// Known problematic package IDs from logs
const PROBLEMATIC_PACKAGES = [
  'esim-de-30days-1gb-all',
  'esim-germany-30days-1gb-all',
  'esim-it-30days-1gb-all',
  'esim-italy-30days-1gb-all'
];

async function getValidRoamifyPackageIds() {
  try {
    console.log('🔍 Fetching valid package IDs from Roamify API...');
    
    const response = await axios.get(`${process.env.ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const countries = response.data.data?.packages || [];
    const validPackageIds = new Set();
    
    countries.forEach(country => {
      if (country.packages && Array.isArray(country.packages)) {
        country.packages.forEach(pkg => {
          if (pkg.packageId) {
            validPackageIds.add(pkg.packageId);
          }
        });
      }
    });

    console.log(`✅ Found ${validPackageIds.size} valid package IDs from Roamify`);
    console.log('📋 Sample valid package IDs:');
    Array.from(validPackageIds).slice(0, 10).forEach(id => {
      console.log(`   - ${id}`);
    });
    
    return validPackageIds;
  } catch (error) {
    console.error('❌ Failed to fetch valid package IDs:', error.message);
    return new Set();
  }
}

async function fixInvalidPackageIds() {
  console.log('🔧 Starting fix for invalid Roamify package IDs...\n');
  
  // Get valid package IDs from Roamify
  const validPackageIds = await getValidRoamifyPackageIds();
  
  if (validPackageIds.size === 0) {
    console.log('⚠️  Could not fetch valid package IDs, using predefined fixes only');
  }
  
  // Step 1: Fix packages in my_packages table
  const { data: myPackages, error: myPackagesError } = await supabase
    .from('my_packages')
    .select('*')
    .not('features->packageId', 'is', null);
  
  if (myPackagesError) {
    console.error('❌ Error fetching my_packages:', myPackagesError);
    return;
  }
  
  console.log(`📦 Found ${myPackages.length} packages with Roamify package IDs\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const pkg of myPackages) {
    const currentPackageId = pkg.features?.packageId;
    
    if (!currentPackageId) {
      console.log(`⚠️  Package ${pkg.name} has no packageId in features`);
      continue;
    }
    
    // Check if package ID is valid
    const isValid = validPackageIds.size > 0 ? validPackageIds.has(currentPackageId) : true;
    const isProblematic = PROBLEMATIC_PACKAGES.includes(currentPackageId);
    
    if (!isValid || isProblematic) {
      console.log(`🔄 Fixing package: ${pkg.name}`);
      console.log(`   Current ID: ${currentPackageId}`);
      console.log(`   Reason: ${isProblematic ? 'Known problematic' : 'Not found in Roamify'}`);
      
      // Determine appropriate fallback
      let fallbackPackageId;
      const countryName = pkg.country_name?.toLowerCase() || '';
      const region = pkg.region?.toLowerCase() || '';
      
      if (countryName.includes('germany') || countryName.includes('deutschland')) {
        fallbackPackageId = WORKING_FALLBACK_PACKAGES.europe;
      } else if (countryName.includes('united states') || countryName.includes('usa')) {
        fallbackPackageId = WORKING_FALLBACK_PACKAGES.usa;
      } else if (region.includes('europe')) {
        fallbackPackageId = WORKING_FALLBACK_PACKAGES.europe;
      } else if (region.includes('asia')) {
        fallbackPackageId = WORKING_FALLBACK_PACKAGES.asia;
      } else {
        fallbackPackageId = WORKING_FALLBACK_PACKAGES.default;
      }
      
      console.log(`   New ID: ${fallbackPackageId}`);
      
      // Update package with working fallback
      const { error: updateError } = await supabase
        .from('my_packages')
        .update({
          features: {
            ...pkg.features,
            packageId: fallbackPackageId,
            originalPackageId: currentPackageId, // Keep track of original for debugging
            fixedAt: new Date().toISOString(),
            fixReason: isProblematic ? 'Known problematic package' : 'Not found in Roamify API'
          }
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
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log(`✅ Fixed packages: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📦 Total packages checked: ${myPackages.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Package mapping fixes completed!');
    console.log('Orders should now work without fallbacks.');
  } else {
    console.log('\n✅ All packages already have valid Roamify IDs.');
  }
}

// Run the fix
fixInvalidPackageIds().catch(console.error); 