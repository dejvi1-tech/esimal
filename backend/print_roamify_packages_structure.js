const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!ROAMIFY_API_KEY) {
  console.error('Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

async function printRoamifyPackagesStructure() {
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    console.log('Top-level keys:', Object.keys(response.data));
    if (response.data.data) {
      console.log('Keys in data:', Object.keys(response.data.data));
      if (Array.isArray(response.data.data.countries)) {
        console.log('Sample country:', JSON.stringify(response.data.data.countries[0], null, 2));
        if (response.data.data.countries[0].packages) {
          console.log('Sample package:', JSON.stringify(response.data.data.countries[0].packages[0], null, 2));
        }
      }
    } else if (Array.isArray(response.data.countries)) {
      console.log('Sample country:', JSON.stringify(response.data.countries[0], null, 2));
      if (response.data.countries[0].packages) {
        console.log('Sample package:', JSON.stringify(response.data.countries[0].packages[0], null, 2));
      }
    } else {
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error fetching or printing structure:', error.response?.data || error.message);
  }
}

printRoamifyPackagesStructure(); 