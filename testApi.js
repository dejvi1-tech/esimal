const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Change if your backend runs elsewhere
const testUser = {
  email: 'dianolazaro@gmail.com',
  password: 'diano1234',
  firstName: 'diano',
  lastName: 'lazaro'
};
let jwt = '';

async function testEndpoint(method, url, data = null, auth = false) {
  try {
    const config = {
      method,
      url: BASE_URL + url,
      headers: {},
      data
    };
    if (auth && jwt) {
      config.headers['Authorization'] = `Bearer ${jwt}`;
    }
    const res = await axios(config);
    console.log(`[PASS] ${method.toUpperCase()} ${url} → Status: ${res.status}`);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.log(`[FAIL] ${method.toUpperCase()} ${url} → Status: ${err.response.status}`);
      console.log('Response:', err.response.data);
    } else {
      console.log(`[ERROR] ${method.toUpperCase()} ${url} →`, err.message);
    }
    return null;
  }
}

(async () => {
  // Register (ignore error if already exists)
  await testEndpoint('post', '/api/auth/register', testUser);

  // Login
  const loginRes = await testEndpoint('post', '/api/auth/login', { email: testUser.email, password: testUser.password });
  if (loginRes && loginRes.data && loginRes.data.accessToken) {
    jwt = loginRes.data.accessToken;
  } else {
    console.log('Login failed, cannot test protected endpoints.');
    return;
  }

  console.log('Login response:', loginRes);

  // --- eSIM Endpoints ---
  await testEndpoint('get', '/api/esim', null, true);
  await testEndpoint('get', '/api/esim/details', null, true);
  // Replace 'your-real-esim-id' with a real eSIM ID from your database
  await testEndpoint('post', '/api/esim/apply', { esim_id: 'f9f70b94-1c6e-4d6a-a769-2c55f4a9c011' }, true);
  await testEndpoint('get', '/api/esim/usage/details', null, true);
  await testEndpoint('get', '/api/esim/usage', null, true);
  await testEndpoint('get', '/api/esim/topup/packages', null, true);
  await testEndpoint('get', '/api/esim/history', null, true);
  await testEndpoint('get', '/api/esim/packages', null, true);

  console.log('eSIM API test script finished.');
})(); 