const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testJWTAuthentication() {
  console.log('🧪 Testing JWT Authentication System\n');

  try {
    // Test 1: Login with correct credentials
    console.log('1. Testing login with correct credentials...');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin-auth/login`, {
      username: 'admin',
      password: 'Admin$123456'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log(`   Token: ${loginResponse.data.token.substring(0, 50)}...`);
      console.log(`   Admin: ${loginResponse.data.admin.username}`);
      
      const token = loginResponse.data.token;

      // Test 2: Verify token
      console.log('\n2. Testing token verification...');
      const verifyResponse = await axios.get(`${BASE_URL}/api/admin-auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (verifyResponse.data.success) {
        console.log('✅ Token verification successful');
        console.log(`   Admin ID: ${verifyResponse.data.admin.adminId}`);
      } else {
        console.log('❌ Token verification failed');
      }

      // Test 3: Access protected admin route
      console.log('\n3. Testing protected admin route...');
      const packagesResponse = await axios.get(`${BASE_URL}/api/admin/my-packages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (packagesResponse.status === 200) {
        console.log('✅ Protected route access successful');
        console.log(`   Packages found: ${packagesResponse.data.length}`);
      } else {
        console.log('❌ Protected route access failed');
      }

      // Test 4: Test with invalid token
      console.log('\n4. Testing with invalid token...');
      try {
        await axios.get(`${BASE_URL}/api/admin/my-packages`, {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });
        console.log('❌ Invalid token should have been rejected');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Invalid token correctly rejected');
        } else {
          console.log('❌ Unexpected error with invalid token');
        }
      }

      // Test 5: Test without token
      console.log('\n5. Testing without token...');
      try {
        await axios.get(`${BASE_URL}/api/admin/my-packages`);
        console.log('❌ Request without token should have been rejected');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Request without token correctly rejected');
        } else {
          console.log('❌ Unexpected error without token');
        }
      }

      // Test 6: Test logout
      console.log('\n6. Testing logout...');
      const logoutResponse = await axios.post(`${BASE_URL}/api/admin-auth/logout`);
      if (logoutResponse.data.success) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed');
      }

    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }

  console.log('\n🎉 JWT Authentication test completed!');
}

// Run the test
testJWTAuthentication(); 