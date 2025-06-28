const axios = require('axios');
require('dotenv').config();

const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const roamifyApiKey = process.env.ROAMIFY_API_KEY;
const esimCode = '8eecd845-2fea-47d3-b39c-8bef57b3d31c';

async function testRoamifyEsimEndpoint() {
  console.log('🧪 Testing Roamify /api/esim Endpoint');
  console.log(`📱 eSIM Code: ${esimCode}`);
  console.log('');

  try {
    console.log('1. Calling Roamify /api/esim endpoint...');
    const response = await axios.get(`${ROAMIFY_API_BASE}/api/esim`, {
      params: {
        iccid: esimCode
      },
      headers: {
        'Authorization': `Bearer ${roamifyApiKey}`,
        'User-Agent': 'insomnia/10.1.1',
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Success! Roamify eSIM Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check for QR code fields
    const responseData = response.data;
    const qrFields = ['qrCode', 'qr_code', 'qr', 'qrcode', 'activationCode', 'activation_code', 'installUrl', 'install_url', 'activationUrl', 'activation_url'];
    
    console.log('');
    console.log('🔍 QR Code Fields Found:');
    let foundQR = false;
    for (const field of qrFields) {
      if (responseData[field]) {
        console.log(`✅ ${field}: ${responseData[field]}`);
        foundQR = true;
      }
    }

    if (foundQR) {
      console.log('');
      console.log('🎉 Real QR code available from Roamify!');
      console.log('This means we can integrate this into the backend for all customers.');
    } else {
      console.log('');
      console.log('❌ No QR code found in response');
      console.log('Available fields:', Object.keys(responseData));
    }

  } catch (error) {
    console.error('❌ Failed to fetch from Roamify:', ROAMIFY_API_BASE, error);
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRoamifyEsimEndpoint(); 