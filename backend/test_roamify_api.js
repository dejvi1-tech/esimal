const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testRoamifyAPI() {
  try {
    console.log('Testing Roamify API directly...');

    const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
    const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

    if (!ROAMIFY_API_KEY) {
      console.error('ROAMIFY_API_KEY not set');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('ROAMIFY')));
      return;
    }

    console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');
    console.log('API Base URL:', ROAMIFY_API_BASE);

    // Test the packages endpoint
    const response = await axios.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = response.data;

    console.log('\n=== RAW ROAMIFY API RESPONSE ===');
    console.log('Response type:', typeof data);
    console.log('Top-level keys:', Object.keys(data || {}));
    console.log('Full response:', JSON.stringify(data, null, 2));
    console.log('=== END RAW RESPONSE ===');

  } catch (error) {
    console.error('Error testing Roamify API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRoamifyAPI(); 