const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testRoamifyAPI() {
  console.log('Testing Roamify API...');
  console.log('API Key:', ROAMIFY_API_KEY ? 'Present' : 'Missing');
  console.log('API URL:', ROAMIFY_API_URL);

  // Test 1: Check API health
  console.log('\n=== Test 1: API Health Check ===');
  try {
    const healthResponse = await axios.get(`${ROAMIFY_API_URL}/api/health`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
      },
      timeout: 10000,
    });
    console.log('Health check status:', healthResponse.status);
    console.log('Health check data:', healthResponse.data);
  } catch (error) {
    console.error('Health check failed:', error.response?.status, error.response?.data);
  }

  // Test 2: Get available packages
  console.log('\n=== Test 2: Get Available Packages ===');
  try {
    const packagesResponse = await axios.get(`${ROAMIFY_API_URL}/api/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    console.log('Packages status:', packagesResponse.status);
    console.log('Packages count:', packagesResponse.data?.data?.packages?.length || 0);
    
    // Find US packages
    const usPackages = packagesResponse.data?.data?.packages?.filter(pkg => 
      pkg.packageId?.includes('united-states') || pkg.packageId?.includes('us')
    ) || [];
    console.log('US packages found:', usPackages.length);
    usPackages.slice(0, 5).forEach(pkg => {
      console.log(`- ${pkg.packageId} (${pkg.name})`);
    });
  } catch (error) {
    console.error('Packages fetch failed:', error.response?.status, error.response?.data);
  }

  // Test 3: Try to create order with the fallback package
  console.log('\n=== Test 3: Create Order with Fallback Package ===');
  try {
    const orderPayload = {
      items: [
        {
          packageId: 'esim-united-states-30days-3gb-all',
          quantity: 1
        }
      ]
    };
    
    console.log('Order payload:', JSON.stringify(orderPayload, null, 2));
    
    const orderResponse = await axios.post(
      `${ROAMIFY_API_URL}/api/esim/order`,
      orderPayload,
      {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    console.log('Order creation status:', orderResponse.status);
    console.log('Order creation data:', JSON.stringify(orderResponse.data, null, 2));
  } catch (error) {
    console.error('Order creation failed:');
    console.error('Status:', error.response?.status);
    console.error('Headers:', JSON.stringify(error.response?.headers, null, 2));
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }

  // Test 4: Try with a different package ID format
  console.log('\n=== Test 4: Try Different Package ID Format ===');
  try {
    const orderPayload = {
      items: [
        {
          packageId: 'esim-united-states-30days-3gb-all',
          quantity: 1
        }
      ]
    };
    
    // Try without the 'esim-' prefix
    const alternativePayload = {
      items: [
        {
          packageId: 'united-states-30days-3gb-all',
          quantity: 1
        }
      ]
    };
    
    console.log('Trying alternative payload:', JSON.stringify(alternativePayload, null, 2));
    
    const orderResponse = await axios.post(
      `${ROAMIFY_API_URL}/api/esim/order`,
      alternativePayload,
      {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    console.log('Alternative order creation status:', orderResponse.status);
    console.log('Alternative order creation data:', JSON.stringify(orderResponse.data, null, 2));
  } catch (error) {
    console.error('Alternative order creation failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testRoamifyAPI().catch(console.error); 