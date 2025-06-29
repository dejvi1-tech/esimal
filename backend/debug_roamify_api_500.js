const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY || 'your_roamify_api_key_here';
const ROAMIFY_BASE_URL = 'https://api.getroamify.com';

async function testRoamifyAPI() {
  console.log('🔍 Testing Roamify API directly...\n');

  try {
    // Test 1: Check if API key is valid
    console.log('1. Testing API key validity...');
    const packagesResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const countries = packagesResponse.data.data?.packages || [];
    console.log('✅ API key is valid');
    console.log(`🌍 Found ${countries.length} countries\n`);

    // Flatten all country packages arrays
    const allPackages = countries.flatMap(country => (country.packages || []).map(pkg => ({
      ...pkg,
      countryName: country.countryName
    })));
    console.log(`📦 Found ${allPackages.length} total packages\n`);

    // Print first 10 real package IDs and names
    console.log('First 10 real package IDs:');
    allPackages.slice(0, 10).forEach((pkg, idx) => {
      console.log(`${idx + 1}. ${pkg.packageId} - ${pkg.package} (${pkg.countryName})`);
    });
    if (allPackages.length === 0) return;

    // Test 2: Try to create an order with the first valid package ID
    const testPackageId = allPackages[0].packageId;
    console.log(`\n2. Testing order creation with packageId: ${testPackageId}`);
    const orderPayload = {
      packageId: testPackageId,
      email: 'test@example.com',
      name: 'Test',
      surname: 'User'
    };
    try {
      const orderResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/orders`, orderPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Order created successfully!');
      console.log('📄 Response:', JSON.stringify(orderResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error occurred:');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);
      console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
  }
}

// Test with different package IDs
async function testMultiplePackages() {
  console.log('\n🔍 Testing multiple package IDs...\n');
  
  const testPackages = [
    'esim-germany-30days-1gb-all',
    'esim-europe-30days-3gb-all',
    'esim-united-states-30days-3gb-all',
    'esim-italy-30days-1gb-all'
  ];

  for (const packageId of testPackages) {
    try {
      console.log(`Testing package: ${packageId}`);
      
      const orderPayload = {
        packageId: packageId,
        email: 'test@example.com',
        name: 'Test',
        surname: 'User'
      };

      const response = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/orders`, orderPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ${packageId} - SUCCESS`);
      console.log(`   Order ID: ${response.data.data?.orderId || 'N/A'}`);
      
    } catch (error) {
      console.log(`❌ ${packageId} - FAILED`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
  }
}

async function main() {
  await testRoamifyAPI();
  await testMultiplePackages();
}

main().catch(console.error); 