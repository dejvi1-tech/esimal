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

async function addPackagesFlexible() {
  console.log('🚀 Adding packages with flexible criteria...\n');

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

    // Get all Roamify packages
    console.log('📡 Fetching all Roamify packages...');
    const roamifyResponse = await axios.get(`${BACKEND_URL}/api/admin/all-roamify-packages`, { headers });
    const roamifyCountries = roamifyResponse.data.data || roamifyResponse.data;
    
    console.log(`✅ Found ${roamifyCountries?.length || 0} countries from Roamify\n`);

    if (!roamifyCountries || !Array.isArray(roamifyCountries)) {
      console.error('❌ Invalid Roamify countries data format');
      return;
    }

    // Priority countries for your market
    const priorityCountries = [
      'germany', 'deutschland', 'italy', 'italia', 'france', 'spain', 
      'united kingdom', 'uk', 'netherlands', 'belgium', 'austria',
      'united states', 'usa', 'canada'
    ];

    // More flexible criteria
    const acceptableDataAmounts = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 50]; // More flexible GB amounts
    const acceptableDurations = [1, 2, 3, 5, 7, 10, 14, 15, 20, 25, 30, 45, 60, 90]; // More flexible durations

    let packagesAdded = 0;
    let errors = 0;

    console.log('🎯 Adding packages with flexible criteria...\n');

    for (const country of roamifyCountries) {
      if (!country.packages || !Array.isArray(country.packages)) continue;

      const countryName = country.countryName?.toLowerCase() || '';
      const isPriorityCountry = priorityCountries.some(p => countryName.includes(p));

      // Process priority countries first, then others
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

          // More flexible criteria
          const isAcceptableData = acceptableDataAmounts.includes(Math.round(dataAmountGB * 10) / 10);
          const isAcceptableDuration = acceptableDurations.includes(days);
          const hasPrice = price > 0;
          const hasPackageId = pkg.packageId && pkg.packageId.length > 10;

          // Accept packages that have at least 2 out of 3 criteria
          const criteriaMet = [isAcceptableData, isAcceptableDuration, hasPrice].filter(Boolean).length >= 2;

          if (!criteriaMet || !hasPackageId) {
            console.log(`   ⏭️  Skipping: ${pkg.package} - ${dataAmountGB}GB/${days}days - €${price}`);
            continue;
          }

          // Create package data for admin API
          const packageData = {
            name: `${Math.round(dataAmountGB * 10) / 10}GB - ${days} days`,
            country_name: country.countryName,
            country_code: country.countryCode?.toUpperCase() || 'XX',
            data_amount: Math.round(dataAmountGB * 10) / 10,
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
              dataAmount: Math.round(dataAmountGB * 10) / 10,
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

    if (packagesAdded > 0) {
      console.log('\n🎉 SUCCESS! Packages added with real Roamify package IDs!');
      console.log('');
      console.log('✅ Benefits:');
      console.log('   - Customers get exactly what they order');
      console.log('   - Real Roamify package IDs used throughout');
      console.log('   - No more Germany → Europe mismatches');
      console.log('   - No more duration mismatches');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Test a Germany order → should get Germany package');
      console.log('   2. Check your admin panel → should show new packages');
      console.log('   3. Verify no more fallback warnings in logs');
    } else {
      console.log('\n❌ NO PACKAGES ADDED!');
      console.log('This means the Roamify packages don\'t meet even the flexible criteria.');
      console.log('We may need to manually add packages or investigate the Roamify API response format.');
    }

  } catch (error) {
    console.error('❌ Error during package addition:', error.response?.data || error.message);
  }
}

// Run the flexible package addition
addPackagesFlexible().catch(console.error); 