const axios = require('axios');
require('dotenv').config();

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testRoamifyAPI() {
  console.log('🔍 Testing Roamify API...');
  console.log('API URL:', ROAMIFY_API_URL);
  console.log('API Key exists:', !!ROAMIFY_API_KEY);
  console.log('API Key preview:', ROAMIFY_API_KEY ? `${ROAMIFY_API_KEY.substring(0, 10)}...` : 'none');

  // Test 1: Health check
  console.log('\n📡 Test 1: Health check');
  try {
    const healthResponse = await axios.get(`${ROAMIFY_API_URL}/api/health-check`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
      },
      timeout: 10000,
    });
    console.log('✅ Health check successful:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.status, error.response?.data || error.message);
  }

  // Test 2: Get packages
  console.log('\n📦 Test 2: Get packages');
  try {
    const packagesResponse = await axios.get(`${ROAMIFY_API_URL}/api/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log('✅ Packages request successful:', packagesResponse.status);
    console.log('Packages data structure:', JSON.stringify(packagesResponse.data, null, 2).substring(0, 500) + '...');
  } catch (error) {
    console.log('❌ Packages request failed:', error.response?.status, error.response?.data || error.message);
  }

  // Test 3: Create eSIM order with the exact payload from the error
  console.log('\n🔧 Test 3: Create eSIM order (exact payload from error)');
  const testPayload = {
    items: [
      {
        packageId: "esim-gr-30days-1gb-all",
        quantity: 1
      }
    ]
  };

  try {
    const orderResponse = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      },
      timeout: 30000,
    });
    console.log('✅ Order creation successful:', orderResponse.status);
    console.log('Order response:', JSON.stringify(orderResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Order creation failed:', error.response?.status);
    console.log('Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error response headers:', JSON.stringify(error.response?.headers, null, 2));
    console.log('Full error:', error.message);
  }

  // Test 4: Test with different package ID
  console.log('\n🔧 Test 4: Create eSIM order (different package)');
  const testPayload2 = {
    items: [
      {
        packageId: "esim-greece-30days-1gb-all",
        quantity: 1
      }
    ]
  };

  try {
    const orderResponse2 = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload2, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      },
      timeout: 30000,
    });
    console.log('✅ Order creation successful (alt package):', orderResponse2.status);
    console.log('Order response:', JSON.stringify(orderResponse2.data, null, 2));
  } catch (error) {
    console.log('❌ Order creation failed (alt package):', error.response?.status);
    console.log('Error response data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 5: Test with minimal payload
  console.log('\n🔧 Test 5: Create eSIM order (minimal payload)');
  const testPayload3 = {
    items: [
      {
        packageId: "esim-gr-30days-1gb-all",
        quantity: 1
      }
    ]
  };

  try {
    const orderResponse3 = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload3, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    });
    console.log('✅ Order creation successful (minimal):', orderResponse3.status);
    console.log('Order response:', JSON.stringify(orderResponse3.data, null, 2));
  } catch (error) {
    console.log('❌ Order creation failed (minimal):', error.response?.status);
    console.log('Error response data:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run the test
testRoamifyAPI().catch(console.error); 