require('dotenv').config();

const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const roamifyApiKey = process.env.ROAMIFY_API_KEY;

if (!roamifyApiKey) {
  console.error('Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

async function debugRoamifyResponse() {
  try {
    console.log('🔍 Debugging Roamify API response...');
    console.log('API Base URL:', ROAMIFY_API_BASE);
    console.log('API Key (first 10 chars):', roamifyApiKey.substring(0, 10) + '...');
    
    const response = await fetch(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${roamifyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const json = await response.json();
    
    console.log('\n📋 Full API Response Structure:');
    console.log('Response type:', typeof json);
    console.log('Top-level keys:', Object.keys(json || {}));
    console.log('\n📄 Full response (first 2000 chars):');
    console.log(JSON.stringify(json, null, 2).substring(0, 2000));
    
    if (json && json.data) {
      console.log('\n📦 Data structure:');
      console.log('Data type:', typeof json.data);
      console.log('Data keys:', Object.keys(json.data || {}));
      
      if (json.data.countries) {
        console.log('\n🌍 Countries found:', json.data.countries.length);
        if (json.data.countries.length > 0) {
          console.log('First country structure:', Object.keys(json.data.countries[0]));
          console.log('First country sample:', JSON.stringify(json.data.countries[0], null, 2));
        }
      } else {
        console.log('\n⚠️  No countries found in data');
        console.log('Available data keys:', Object.keys(json.data));
      }
    }

  } catch (error) {
    console.error('❌ Error debugging Roamify response:', error);
  }
}

debugRoamifyResponse(); 