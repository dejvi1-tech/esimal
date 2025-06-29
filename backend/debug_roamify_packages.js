const axios = require('axios');

// Roamify API configuration
const ROAMIFY_API_URL = 'https://api.getroamify.com';
const ROAMIFY_API_KEY = 'WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN';

async function debugRoamifyPackages() {
  console.log('🔍 Fetching all packages from Roamify API...\n');

  try {
    // Fetch all packages from Roamify
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Successfully fetched packages from Roamify:');
    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Check if response.data is an array
    if (Array.isArray(response.data)) {
      console.log(`📦 Total packages: ${response.data.length}\n`);

      // Display first 10 packages with their IDs
      response.data.slice(0, 10).forEach((pkg, index) => {
        console.log(`${index + 1}. Package ID: ${pkg.id}`);
        console.log(`   Name: ${pkg.name || 'N/A'}`);
        console.log(`   Data: ${pkg.data || 'N/A'}`);
        console.log(`   Validity: ${pkg.validity || 'N/A'}`);
        console.log(`   Price: ${pkg.price || 'N/A'}`);
        console.log(`   Region: ${pkg.region || 'N/A'}`);
        console.log('');
      });

      // Look for Europe/US packages specifically
      console.log('🌍 Looking for Europe/US packages...\n');
      const europeUsPackages = response.data.filter(pkg => 
        pkg.name && (
          pkg.name.toLowerCase().includes('europe') || 
          pkg.name.toLowerCase().includes('united states') ||
          pkg.name.toLowerCase().includes('us') ||
          pkg.region && pkg.region.toLowerCase().includes('europe')
        )
      );

      if (europeUsPackages.length > 0) {
        console.log(`Found ${europeUsPackages.length} Europe/US packages:`);
        europeUsPackages.forEach((pkg, index) => {
          console.log(`${index + 1}. Package ID: ${pkg.id}`);
          console.log(`   Name: ${pkg.name}`);
          console.log(`   Data: ${pkg.data}`);
          console.log(`   Validity: ${pkg.validity}`);
          console.log(`   Price: ${pkg.price}`);
          console.log(`   Region: ${pkg.region}`);
          console.log('');
        });
      } else {
        console.log('❌ No Europe/US packages found');
      }
    } else {
      console.log('❌ Response data is not an array. Structure:', typeof response.data);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error fetching packages from Roamify:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugRoamifyPackages(); 