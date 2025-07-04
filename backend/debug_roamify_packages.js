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

async function debugRoamifyPackages() {
  console.log('🔍 Debugging Roamify packages...\n');

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

    // Common data amounts customers want
    const popularDataAmounts = [1, 2, 3, 5, 10, 15, 20]; // in GB
    const popularDurations = [7, 15, 30]; // in days

    let totalPackages = 0;
    let priorityPackages = 0;
    let popularPackages = 0;
    let validPackages = 0;

    console.log('🔍 ANALYZING PACKAGES:\n');

    for (const country of roamifyCountries) {
      if (!country.packages || !Array.isArray(country.packages)) continue;

      const countryName = country.countryName?.toLowerCase() || '';
      const isPriorityCountry = priorityCountries.some(p => countryName.includes(p));

      console.log(`\n🌍 ${country.countryName} (${country.countryCode}) - ${country.packages.length} packages`);
      console.log(`   Priority country: ${isPriorityCountry ? 'YES' : 'NO'}`);

      for (const pkg of country.packages) {
        totalPackages++;

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

        // Check criteria
        const isPopularData = popularDataAmounts.includes(Math.round(dataAmountGB));
        const isPopularDuration = popularDurations.includes(days);
        const hasPrice = price > 0;

        if (isPriorityCountry) priorityPackages++;
        if (isPopularData && isPopularDuration && hasPrice) {
          popularPackages++;
          console.log(`   ✅ ${pkg.package} - ${dataAmountGB}GB/${days}days - €${price} (${pkg.packageId})`);
        } else {
          console.log(`   ❌ ${pkg.package} - ${dataAmountGB}GB/${days}days - €${price} (${pkg.packageId})`);
          console.log(`      Data: ${isPopularData ? '✅' : '❌'} (${Math.round(dataAmountGB)}GB), Duration: ${isPopularDuration ? '✅' : '❌'} (${days}days), Price: ${hasPrice ? '✅' : '❌'} (€${price})`);
        }

        if (isPopularData && isPopularDuration && hasPrice) {
          validPackages++;
        }
      }
    }

    console.log('\n=== DEBUG SUMMARY ===');
    console.log(`📊 Total packages found: ${totalPackages}`);
    console.log(`🌍 Priority country packages: ${priorityPackages}`);
    console.log(`✅ Valid packages (popular data + duration + price): ${validPackages}`);
    console.log(`🎯 Popular packages (priority + valid): ${popularPackages}`);

    if (validPackages === 0) {
      console.log('\n❌ NO VALID PACKAGES FOUND!');
      console.log('This means:');
      console.log('- Data amounts don\'t match popular sizes (1,2,3,5,10,15,20 GB)');
      console.log('- Durations don\'t match popular periods (7,15,30 days)');
      console.log('- Prices are missing or zero');
      console.log('\n💡 SOLUTION: Let\'s relax the criteria and add more packages!');
    } else {
      console.log('\n✅ VALID PACKAGES FOUND!');
      console.log('The script should have added these packages.');
    }

  } catch (error) {
    console.error('❌ Error debugging Roamify packages:', error.response?.data || error.message);
  }
}

// Run the debug
debugRoamifyPackages().catch(console.error); 