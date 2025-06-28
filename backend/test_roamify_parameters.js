const axios = require('axios');
require('dotenv').config();

const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

if (!ROAMIFY_API_KEY) {
  console.error('ROAMIFY_API_KEY not set');
  process.exit(1);
}

async function testRoamifyParameters() {
  console.log('🧪 Testing Roamify API parameters...');
  console.log('API Base URL:', ROAMIFY_API_BASE);
  console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');

  const testCases = [
    {
      name: 'No parameters',
      endpoint: '/api/esim/packages',
      params: {}
    },
    {
      name: 'With limit parameter',
      endpoint: '/api/esim/packages',
      params: { limit: 100 }
    },
    {
      name: 'With page and limit',
      endpoint: '/api/esim/packages',
      params: { page: 1, limit: 50 }
    },
    {
      name: 'With offset and limit',
      endpoint: '/api/esim/packages',
      params: { offset: 0, limit: 100 }
    },
    {
      name: 'With all parameter',
      endpoint: '/api/esim/packages',
      params: { all: true }
    },
    {
      name: 'Alternative endpoint - /api/packages',
      endpoint: '/api/packages',
      params: {}
    },
    {
      name: 'Alternative endpoint with pagination',
      endpoint: '/api/packages',
      params: { page: 1, limit: 50 }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Test: ${testCase.name} ===`);
    console.log(`Endpoint: ${testCase.endpoint}`);
    console.log(`Parameters:`, testCase.params);
    
    try {
      const response = await axios.get(`${ROAMIFY_API_BASE}${testCase.endpoint}`, {
        headers: {
          Authorization: `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: testCase.params,
        timeout: 30000
      });

      console.log(`✅ Status: ${response.status}`);
      
      const data = response.data;
      console.log('Response type:', typeof data);
      console.log('Top-level keys:', Object.keys(data || {}));
      
      // Count packages
      let totalPackages = 0;
      let countries = 0;
      
      if (data && data.data) {
        if (data.data.packages && Array.isArray(data.data.packages)) {
          // Structure: data.packages (array of countries)
          countries = data.data.packages.length;
          for (const country of data.data.packages) {
            if (country.packages && Array.isArray(country.packages)) {
              totalPackages += country.packages.length;
            }
          }
        } else if (data.data.countries && Array.isArray(data.data.countries)) {
          // Structure: data.countries (array of countries)
          countries = data.data.countries.length;
          for (const country of data.data.countries) {
            if (country.packages && Array.isArray(country.packages)) {
              totalPackages += country.packages.length;
            }
          }
        } else if (Array.isArray(data.data)) {
          // Structure: data (array of packages directly)
          totalPackages = data.data.length;
        }
      }
      
      console.log(`📊 Results: ${countries} countries, ${totalPackages} packages`);
      
      if (totalPackages > 0) {
        console.log('✅ SUCCESS: Found packages');
      } else {
        console.log('⚠️  WARNING: No packages found');
      }
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('This test will help determine which parameters the Roamify API actually supports.');
  console.log('Look for the test cases that return packages successfully.');
}

testRoamifyParameters(); 