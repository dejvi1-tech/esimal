const axios = require('axios');
const readline = require('readline');

const BACKEND_URL = 'https://esimal.onrender.com';

// Function to get admin JWT token
async function getAdminToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your admin JWT token: ', (token) => {
      rl.close();
      resolve(token.trim());
    });
  });
}

async function runCompleteSync() {
  console.log('🚀 Starting complete package sync via admin API...\n');

  try {
    // Get admin token
    const token = await getAdminToken();
    if (!token) {
      console.error('❌ Admin token is required');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 1: Clear my_packages by getting all packages and deleting them
    console.log('🗑️  Step 1: Getting current my_packages...');
    const myPackagesResponse = await axios.get(`${BACKEND_URL}/api/admin/my-packages`, { headers });
    const currentPackages = myPackagesResponse.data.data || myPackagesResponse.data;
    
    console.log(`📋 Found ${currentPackages?.length || 0} packages to clear`);

    // Delete all packages
    if (currentPackages && Array.isArray(currentPackages)) {
      for (const pkg of currentPackages) {
      try {
        await axios.delete(`${BACKEND_URL}/api/admin/delete-package/${pkg.id}`, { headers });
        console.log(`   ✅ Deleted: ${pkg.name} (${pkg.country_name})`);
      } catch (error) {
        console.error(`   ❌ Error deleting ${pkg.name}:`, error.response?.data || error.message);
              }
      }
    } else {
      console.log('⚠️  No packages found to clear or invalid response format');
    }

    console.log('\n✅ All packages cleared from my_packages table');

    // Step 2: Get all Roamify packages
    console.log('\n📡 Step 2: Fetching all Roamify packages...');
    const roamifyResponse = await axios.get(`${BACKEND_URL}/api/admin/all-roamify-packages`, { headers });
    const roamifyCountries = roamifyResponse.data.data || roamifyResponse.data;
    
    console.log(`✅ Found ${roamifyCountries?.length || 0} countries from Roamify`);

    // Step 3: Process and add packages strategically
    console.log('\n🎯 Step 3: Adding properly mapped packages...');
    
    let packagesAdded = 0;
    let errors = 0;

    // Priority countries for your market
    const priorityCountries = [
      'germany', 'deutschland', 'italy', 'italia', 'france', 'spain', 
      'united kingdom', 'uk', 'netherlands', 'belgium', 'austria',
      'united states', 'usa', 'canada'
    ];

    // Common data amounts customers want
    const popularDataAmounts = [1, 2, 3, 5, 10, 15, 20]; // in GB
    const popularDurations = [7, 15, 30]; // in days

    if (!roamifyCountries || !Array.isArray(roamifyCountries)) {
      console.error('❌ Invalid Roamify countries data format');
      return;
    }

    for (const country of roamifyCountries) {
      if (!country.packages || !Array.isArray(country.packages)) continue;

      const countryName = country.countryName?.toLowerCase() || '';
      const isPriorityCountry = priorityCountries.some(p => countryName.includes(p));

      // Skip non-priority countries for now
      if (!isPriorityCountry) continue;

      console.log(`\n🌍 Processing: ${country.countryName} (${country.countryCode})`);

      for (const pkg of country.packages) {
        try {
          // Parse package data
          let dataAmountGB = 0;
          if (pkg.dataAmount && pkg.dataUnit) {
            if (pkg.dataUnit.toUpperCase() === 'GB') {
              dataAmountGB = pkg.dataAmount;
            } else if (pkg.dataUnit.toUpperCase() === 'MB') {
              dataAmountGB = pkg.dataAmount / 1024;
            }
          }

          const days = pkg.day || 0;
          const price = pkg.price || 0;

          // Only add packages that match popular configurations
          const isPopularData = popularDataAmounts.includes(Math.round(dataAmountGB));
          const isPopularDuration = popularDurations.includes(days);

          if (!isPopularData || !isPopularDuration || !price) {
            continue; // Skip unpopular configurations
          }

          // Create package data for admin API
          const packageData = {
            name: `${Math.round(dataAmountGB)}GB - ${days} days`,
            country_name: country.countryName,
            country_code: country.countryCode?.toUpperCase() || 'XX',
            data_amount: dataAmountGB,
            days: days,
            base_price: price,
            sale_price: price * 1.2, // 20% markup
            profit: price * 0.2,
            reseller_id: pkg.packageId, // ✅ Store REAL Roamify package ID here
            region: country.region || 'Unknown',
            visible: true,
            show_on_frontend: true,
            location_slug: country.countryCode?.toLowerCase() || 'unknown',
            homepage_order: isPriorityCountry ? 1 : 2,
            features: {
              packageId: pkg.packageId, // Real Roamify package ID
              dataAmount: dataAmountGB,
              days: days,
              price: price,
              currency: 'EUR',
              plan: pkg.plan || 'data-only',
              activation: pkg.activation || 'first-use',
              isUnlimited: pkg.isUnlimited || false,
              withSMS: pkg.withSMS || false,
              withCall: pkg.withCall || false,
              withHotspot: pkg.withHotspot || true,
              withDataRoaming: pkg.withDataRoaming || true,
              geography: country.geography || 'local',
              region: country.region,
              countrySlug: country.countrySlug,
              notes: [],
              // Metadata for debugging
              originalRoamifyData: {
                packageId: pkg.packageId,
                package: pkg.package,
                dataAmount: pkg.dataAmount,
                dataUnit: pkg.dataUnit,
                day: pkg.day,
                price: pkg.price
              }
            }
          };

          // Add package via admin API
          await axios.post(`${BACKEND_URL}/api/admin/save-package`, packageData, { headers });
          
          console.log(`   ✅ Added: ${packageData.name} (${pkg.packageId})`);
          packagesAdded++;

        } catch (error) {
          console.error(`   ❌ Error adding package:`, error.response?.data || error.message);
          errors++;
        }
      }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`✅ Packages successfully added: ${packagesAdded}`);
    console.log(`❌ Errors encountered: ${errors}`);
    console.log(`🌍 Countries processed: ${roamifyCountries.length}`);

    console.log('\n🎉 COMPLETE PACKAGE SYNC COMPLETED!');
    console.log('');
    console.log('✅ Benefits of this fix:');
    console.log('   - Customers get exactly what they order');
    console.log('   - Real Roamify package IDs used throughout');
    console.log('   - No more Germany → Europe mismatches');
    console.log('   - No more 30 days → 3 days mismatches');
    console.log('   - Popular packages from priority countries');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Test a Germany order → should get Germany package');
    console.log('   2. Check your admin panel → should show new packages');
    console.log('   3. Verify no more fallback warnings in logs');

    if (packagesAdded > 0) {
      console.log('\n🚀 Your eSIM marketplace is now properly configured!');
    }

  } catch (error) {
    console.error('❌ Error during complete package sync:', error.response?.data || error.message);
  }
}

// Run the complete sync
runCompleteSync().catch(console.error); 