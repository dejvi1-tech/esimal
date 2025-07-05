const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_BASE_URL = 'https://api.getroamify.com';

if (!ROAMIFY_API_KEY) {
  console.error('❌ ROAMIFY_API_KEY not set');
  process.exit(1);
}

console.log('🔍 Debugging Roamify 500 Error...\n');

async function debugRoamify500Error() {
  try {
    // Step 1: Test API connectivity
    console.log('1. Testing API connectivity...');
    const healthResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/health-check`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ API health check:', healthResponse.status, healthResponse.data);

    // Step 2: Get available packages
    console.log('\n2. Getting available packages...');
    const packagesResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const countries = packagesResponse.data.data?.packages || [];
    const allPackages = countries.flatMap(country => (country.packages || []).map(pkg => ({
      ...pkg,
      countryName: country.countryName
    })));

    console.log(`✅ Found ${allPackages.length} packages`);
    
    // Find the specific Greece package
    const greecePackage = allPackages.find(pkg => pkg.packageId === 'esim-gr-30days-1gb-all');
    if (greecePackage) {
      console.log('✅ Found Greece package:', greecePackage);
    } else {
      console.log('❌ Greece package not found in available packages');
      console.log('Available Greece packages:');
      allPackages.filter(pkg => pkg.packageId.includes('gr-')).forEach(pkg => {
        console.log(`  - ${pkg.packageId}`);
      });
    }

    // Step 3: Test the exact payload that's failing
    console.log('\n3. Testing the exact failing payload...');
    const testPayload = {
      items: [
        {
          packageId: 'esim-gr-30days-1gb-all',
          quantity: 1
        }
      ]
    };

    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    try {
      const orderResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, testPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'esim-marketplace/1.0.0'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ Order creation successful!');
      console.log('Response:', JSON.stringify(orderResponse.data, null, 2));

    } catch (orderError) {
      console.log('❌ Order creation failed');
      console.log(`Status: ${orderError.response?.status}`);
      console.log(`Status Text: ${orderError.response?.statusText}`);
      console.log(`Response Data:`, JSON.stringify(orderError.response?.data, null, 2));
      console.log(`Response Headers:`, JSON.stringify(orderError.response?.headers, null, 2));
      
      // Step 4: Try alternative approaches
      console.log('\n4. Trying alternative approaches...');
      
      // Try with different User-Agent
      try {
        const altResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, testPayload, {
          headers: {
            'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'axios/1.10.0'
          }
        });
        console.log('✅ Alternative User-Agent worked!');
      } catch (altError) {
        console.log('❌ Alternative User-Agent also failed');
      }

      // Try with different package if Greece package doesn't exist
      if (!greecePackage && allPackages.length > 0) {
        const alternativePackage = allPackages[0];
        console.log(`\n5. Trying with alternative package: ${alternativePackage.packageId}`);
        
        const altPayload = {
          items: [
            {
              packageId: alternativePackage.packageId,
              quantity: 1
            }
          ]
        };

        try {
          const altOrderResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, altPayload, {
            headers: {
              'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Alternative package worked!');
          console.log('Response:', JSON.stringify(altOrderResponse.data, null, 2));
        } catch (altPkgError) {
          console.log('❌ Alternative package also failed');
          console.log(`Status: ${altPkgError.response?.status}`);
          console.log(`Data:`, JSON.stringify(altPkgError.response?.data, null, 2));
        }
      }
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function checkApiStatus() {
  console.log('\n🔍 Checking Roamify API Status...\n');
  
  try {
    // Check if it's a general API issue
    const response = await axios.get('https://api.getroamify.com/api/health-check', {
      timeout: 10000
    });
    console.log('✅ Roamify API is responding');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.log('❌ Roamify API may be down');
    console.log('Error:', error.message);
  }
}

async function main() {
  await checkApiStatus();
  await debugRoamify500Error();
  
  console.log('\n📋 SUMMARY:');
  console.log('1. Check if Roamify API is experiencing issues');
  console.log('2. Verify the Greece package ID exists');
  console.log('3. Check if there are any API rate limits');
  console.log('4. Contact Roamify support if the issue persists');
}

main().catch(console.error); 