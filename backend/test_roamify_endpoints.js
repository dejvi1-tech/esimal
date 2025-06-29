const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!ROAMIFY_API_KEY) {
  console.error('Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

async function testRoamifyEndpoints() {
  console.log('Testing Roamify API endpoints...\n');

  const endpoints = [
    '/api/packages',
    '/api/package',
    '/api/esim/packages',
    '/api/esim/package',
    '/packages',
    '/package',
    '/esim/packages',
    '/esim/package',
    '/api/v1/packages',
    '/api/v1/package',
    '/api/v2/packages',
    '/api/v2/package',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(`${ROAMIFY_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log(`✅ SUCCESS (${response.status}): ${endpoint}`);
      console.log(`   Response data:`, JSON.stringify(response.data, null, 2));
      console.log('   ---');
      
      // If we get a successful response with packages, we found the right endpoint
      if (response.data?.data?.packages || response.data?.packages) {
        console.log(`🎉 FOUND WORKING ENDPOINT: ${endpoint}`);
        return endpoint;
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED (${error.response.status}): ${endpoint} - ${error.response.data?.message || 'Unknown error'}`);
      } else {
        console.log(`❌ FAILED (Network error): ${endpoint} - ${error.message}`);
      }
    }
  }

  console.log('\nNo working packages endpoint found. Let\'s try a different approach...');
  
  // Try to get any available endpoints by testing the root
  try {
    console.log('\nTesting root endpoint...');
    const response = await axios.get(`${ROAMIFY_API_URL}/`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log(`Root response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`Root endpoint failed:`, error.response?.status, error.response?.data);
  }
}

testRoamifyEndpoints().catch(console.error); 