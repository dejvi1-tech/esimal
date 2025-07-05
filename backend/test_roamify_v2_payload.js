const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_BASE_URL = 'https://api.getroamify.com';

if (!ROAMIFY_API_KEY) {
  console.error('❌ ROAMIFY_API_KEY not set');
  process.exit(1);
}

console.log('🔑 API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');

async function testV2PayloadFormat() {
  console.log('\n🔍 Testing Roamify V2 Payload Format with Items Array...\n');

  try {
    // Test 1: Get available packages to find a valid packageId
    console.log('1. Getting available packages...');
    const packagesResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      }
    });
    
    const countries = packagesResponse.data.data?.packages || [];
    console.log(`✅ Found ${countries.length} countries`);

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

    // Test 2: Test the new V2 payload format with items array
    const testPackageId = allPackages[0].packageId;
    console.log(`\n2. Testing V2 payload format with packageId: ${testPackageId}`);

    // NEW V2 FORMAT: items array
    const v2Payload = {
      items: [
        {
          packageId: testPackageId,
          quantity: 1,
          days: 30
        }
      ]
    };

    // OLD FORMAT: top-level fields (for comparison)
    const oldPayload = {
      packageId: testPackageId,
      quantity: 1,
      days: 30
    };

    const headers = {
      'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'esim-marketplace/1.0.0'
    };

    // Test V2 format (should work)
    console.log('\n   Testing V2 format (items array):');
    console.log('   Payload:', JSON.stringify(v2Payload, null, 2));
    
    try {
      const v2Response = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, v2Payload, { headers });
      
      console.log('   ✅ V2 FORMAT SUCCESS!');
      console.log('   📄 Response:', JSON.stringify(v2Response.data, null, 2));
      
      // Extract order and eSIM info
      const data = v2Response.data;
      const result = data.data || data;
      const orderId = result.orderId || result.id || result.order_id;
      const esimId = result.esimId || result.iccid || result.esim_code || result.code || result.id;
      
      console.log(`   📋 Order ID: ${orderId}`);
      console.log(`   📱 eSIM ID: ${esimId}`);
      
    } catch (v2Error) {
      console.log('   ❌ V2 FORMAT FAILED');
      console.log(`   Status: ${v2Error.response?.status}`);
      console.log(`   Error: ${v2Error.response?.data?.message || v2Error.message}`);
      console.log(`   Data:`, JSON.stringify(v2Error.response?.data, null, 2));
    }

    // Test old format (should fail with "items" is required error)
    console.log('\n   Testing old format (top-level fields):');
    console.log('   Payload:', JSON.stringify(oldPayload, null, 2));
    
    try {
      const oldResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, oldPayload, { headers });
      
      console.log('   ⚠️ OLD FORMAT STILL WORKS (unexpected)');
      console.log('   📄 Response:', JSON.stringify(oldResponse.data, null, 2));
      
    } catch (oldError) {
      console.log('   ✅ OLD FORMAT FAILED (expected)');
      console.log(`   Status: ${oldError.response?.status}`);
      console.log(`   Error: ${oldError.response?.data?.message || oldError.message}`);
      
      if (oldError.response?.data?.message?.includes('items')) {
        console.log('   ✅ Confirmed: "items" is required error received');
      }
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
    console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
  }
}

async function testSpecificPackageV2() {
  console.log('\n🔍 Testing specific package with V2 format...\n');
  
  const testPackageId = 'esim-europe-us-30days-3gb-all'; // Example package ID
  
  const v2Payload = {
    items: [
      {
        packageId: testPackageId,
        quantity: 1,
        days: 30
      }
    ]
  };

  const headers = {
    'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'esim-marketplace/1.0.0'
  };

  try {
    console.log(`Testing package ${testPackageId} with V2 format`);
    console.log('Payload:', JSON.stringify(v2Payload, null, 2));
    
    const response = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, v2Payload, { headers });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Extract order and eSIM info
    const data = response.data;
    const result = data.data || data;
    const orderId = result.orderId || result.id || result.order_id;
    const esimId = result.esimId || result.iccid || result.esim_code || result.code || result.id;
    
    console.log(`📋 Order ID: ${orderId}`);
    console.log(`📱 eSIM ID: ${esimId}`);
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
    console.log(`Data:`, JSON.stringify(error.response?.data, null, 2));
  }
}

async function main() {
  await testV2PayloadFormat();
  await testSpecificPackageV2();
}

main().catch(console.error); 