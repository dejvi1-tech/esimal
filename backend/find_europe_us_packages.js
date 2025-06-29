const axios = require('axios');

// Roamify API configuration
const ROAMIFY_API_URL = 'https://api.getroamify.com';
const ROAMIFY_API_KEY = 'WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN';

async function findEuropeUsPackages() {
  console.log('🔍 Finding Europe and US packages from Roamify...\n');

  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const countries = response.data.countries || [];
    console.log(`📦 Total countries: ${countries.length}\n`);

    // Find Europe and US packages
    const europeUsPackages = [];
    
    countries.forEach(country => {
      if (country.packages && Array.isArray(country.packages)) {
        country.packages.forEach(pkg => {
          // Check if this is a Europe or US package
          const isEuropeUs = 
            country.region === 'Europe' || 
            country.countryName === 'United States' ||
            country.countryCode === 'US' ||
            pkg.package.toLowerCase().includes('europe') ||
            pkg.package.toLowerCase().includes('united states') ||
            pkg.package.toLowerCase().includes('global');

          if (isEuropeUs) {
            europeUsPackages.push({
              packageId: pkg.packageId,
              package: pkg.package,
              country: country.countryName,
              region: country.region,
              price: pkg.price,
              data: pkg.dataAmount + ' ' + pkg.dataUnit,
              validity: pkg.day + ' days'
            });
          }
        });
      }
    });

    console.log(`🌍 Found ${europeUsPackages.length} Europe/US packages:\n`);
    
    europeUsPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. Package ID: ${pkg.packageId}`);
      console.log(`   Name: ${pkg.package}`);
      console.log(`   Country: ${pkg.country} (${pkg.region})`);
      console.log(`   Data: ${pkg.data}`);
      console.log(`   Validity: ${pkg.validity}`);
      console.log(`   Price: $${pkg.price}`);
      console.log('');
    });

    // Look for packages similar to what you're trying to sell
    console.log('🎯 Looking for packages similar to "esim-europe-us-30days-3gb-all":\n');
    
    const similarPackages = europeUsPackages.filter(pkg => 
      pkg.package.toLowerCase().includes('3gb') ||
      pkg.package.toLowerCase().includes('30') ||
      pkg.package.toLowerCase().includes('europe') ||
      pkg.package.toLowerCase().includes('global')
    );

    if (similarPackages.length > 0) {
      console.log(`Found ${similarPackages.length} similar packages:\n`);
      similarPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. Package ID: ${pkg.packageId}`);
        console.log(`   Name: ${pkg.package}`);
        console.log(`   Country: ${pkg.country} (${pkg.region})`);
        console.log(`   Data: ${pkg.data}`);
        console.log(`   Validity: ${pkg.validity}`);
        console.log(`   Price: $${pkg.price}`);
        console.log('');
      });
    } else {
      console.log('❌ No similar packages found');
    }

    // Save all package IDs for reference
    console.log('💾 All Europe/US package IDs:');
    const packageIds = europeUsPackages.map(pkg => pkg.packageId);
    console.log(JSON.stringify(packageIds, null, 2));

  } catch (error) {
    console.error('❌ Error fetching packages:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

findEuropeUsPackages(); 