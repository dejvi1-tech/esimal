const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_BASE_URL = 'https://api.getroamify.com';

if (!ROAMIFY_API_KEY) {
  console.error('❌ ROAMIFY_API_KEY not set');
  process.exit(1);
}

console.log('🔑 API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');

async function testRoamifyIntegration() {
  console.log('\n🔍 Testing Roamify API Integration...\n');

  try {
    // Test 1: Check API health and get available packages
    console.log('1. Testing API health and getting packages...');
    const packagesResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      }
    });
    
    const countries = packagesResponse.data.data?.packages || [];
    console.log('✅ API is healthy');
    console.log(`🌍 Found ${countries.length} countries`);

    // Flatten all country packages arrays
    const allPackages = countries.flatMap(country => (country.packages || []).map(pkg => ({
      ...pkg,
      countryName: country.countryName
    })));
    console.log(`📦 Found ${allPackages.length} total packages`);

    if (allPackages.length === 0) {
      console.log('❌ No packages found');
      return;
    }

    // Test 2: Try both endpoints with a valid package
    const testPackageId = allPackages[0].packageId;
    console.log(`\n2. Testing order creation with packageId: ${testPackageId}`);

    const testPayload = {
      items: [
        {
          packageId: testPackageId,
          quantity: 1
        }
      ]
    };

    const headers = {
      'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'esim-marketplace/1.0.0'
    };

    // Test both endpoints
    const endpoints = [
      `${ROAMIFY_BASE_URL}/api/esim/orders`,
      `${ROAMIFY_BASE_URL}/api/esim/order`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n   Trying endpoint: ${endpoint}`);
        const response = await axios.post(endpoint, testPayload, { headers });
        
        console.log('   ✅ SUCCESS!');
        console.log('   📄 Response:', JSON.stringify(response.data, null, 2));
        
        // Extract order and eSIM info
        const data = response.data;
        const result = data.data || data;
        const orderId = result.orderId || result.id || result.order_id;
        const esimId = result.esimId || result.iccid || result.esim_code || result.code || result.id;
        
        console.log(`   📋 Order ID: ${orderId}`);
        console.log(`   📱 eSIM ID: ${esimId}`);
        
        return; // Success, exit
        
      } catch (error) {
        console.log(`   ❌ FAILED`);
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 404) {
          console.log('   (This is expected for wrong endpoint)');
        }
      }
    }

    console.log('\n❌ All endpoints failed');

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
  }
}

async function testSpecificPackage() {
  console.log('\n🔍 Testing specific package ID...\n');
  
  const testPackageId = 'esim-europe-us-30days-3gb-all'; // The one from the logs
  
  const testPayload = {
    items: [
      {
        packageId: testPackageId,
        quantity: 1
      }
    ]
  };

  const headers = {
    'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'esim-marketplace/1.0.0'
  };

  const endpoints = [
    `${ROAMIFY_BASE_URL}/api/esim/orders`,
    `${ROAMIFY_BASE_URL}/api/esim/order`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing package ${testPackageId} with endpoint: ${endpoint}`);
      const response = await axios.post(endpoint, testPayload, { headers });
      
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
      
    } catch (error) {
      console.log(`❌ FAILED with endpoint ${endpoint}`);
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
      console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
    }
  }
}

async function main() {
  await testRoamifyIntegration();
  await testSpecificPackage();
}

main().catch(console.error); 