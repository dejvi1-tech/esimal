const axios = require('axios');

async function testCorsEndpoint() {
  try {
    console.log('Testing CORS and endpoint accessibility...');
    
    // Test the admin endpoint (this will fail without auth, but we can check CORS headers)
    const response = await axios.get('https://esimal.onrender.com/api/admin/all-roamify-packages', {
      headers: {
        'Origin': 'https://esimfly.al',
        'Content-Type': 'application/json',
      },
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500 to see CORS headers
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:');
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    console.log('Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
    
    if (response.status === 401) {
      console.log('✅ CORS is working! Got 401 (unauthorized) which means the request reached the server');
      console.log('Response data:', response.data);
    } else if (response.status === 200) {
      console.log('✅ Endpoint is accessible and returning data!');
      console.log('Response data:', response.data);
    } else {
      console.log('❌ Unexpected status:', response.status);
      console.log('Response data:', response.data);
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
  }
}

testCorsEndpoint(); 