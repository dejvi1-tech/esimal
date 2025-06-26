const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogoutAndAuth() {
  console.log('🧪 Testing Logout and Authentication Requirement\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin-auth/login`, {
      username: 'admin',
      password: 'Admin$123456'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Step 2: Test accessing protected route with valid token
    console.log('\n2. Testing protected route with valid token...');
    const protectedResponse = await axios.get(`${BASE_URL}/api/admin/my-packages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (protectedResponse.status === 200) {
      console.log('✅ Protected route accessible with valid token');
    } else {
      console.log('❌ Protected route not accessible with valid token');
    }

    // Step 3: Test logout
    console.log('\n3. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/admin-auth/logout`);
    
    if (logoutResponse.data.success) {
      console.log('✅ Logout successful');
    } else {
      console.log('❌ Logout failed');
    }

    // Step 4: Test accessing protected route without token
    console.log('\n4. Testing protected route without token...');
    try {
      await axios.get(`${BASE_URL}/api/admin/my-packages`);
      console.log('❌ Protected route should have been rejected without token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protected route correctly rejected without token');
      } else {
        console.log('❌ Unexpected error without token');
      }
    }

    // Step 5: Test accessing protected route with invalid token
    console.log('\n5. Testing protected route with invalid token...');
    try {
      await axios.get(`${BASE_URL}/api/admin/my-packages`, {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        }
      });
      console.log('❌ Protected route should have been rejected with invalid token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protected route correctly rejected with invalid token');
      } else {
        console.log('❌ Unexpected error with invalid token');
      }
    }

    console.log('\n🎉 Authentication test completed!');
    console.log('\n📝 To test in browser:');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Find "Local Storage" and delete "adminToken"');
    console.log('4. Refresh the admin page - you should be redirected to login');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testLogoutAndAuth(); 