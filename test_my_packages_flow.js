const axios = require('axios');

// Test the complete flow
async function testMyPackagesFlow() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing My Packages Flow...\n');

  try {
    // 1. Test frontend-packages endpoint (should return empty array initially)
    console.log('1. Testing /api/frontend-packages...');
    const frontendResponse = await axios.get(`${baseURL}/api/frontend-packages`);
    console.log('✅ Frontend packages:', frontendResponse.data);
    console.log('   Count:', frontendResponse.data.length);
    console.log('');

    // 2. Test all-packages endpoint (should return Roamify packages)
    console.log('2. Testing /api/packages/all-packages...');
    const roamifyResponse = await axios.get(`${baseURL}/api/packages/all-packages`);
    console.log('✅ Roamify packages fetched');
    console.log('   Count:', roamifyResponse.data.length);
    if (roamifyResponse.data.length > 0) {
      console.log('   Sample package:', {
        id: roamifyResponse.data[0].id,
        name: roamifyResponse.data[0].name,
        country: roamifyResponse.data[0].country,
        packageId: roamifyResponse.data[0].packageId
      });
    }
    console.log('');

    // 3. Test order creation endpoint (should fail without proper package)
    console.log('3. Testing /api/orders/my-packages...');
    try {
      const orderResponse = await axios.post(`${baseURL}/api/orders/my-packages`, {
        packageId: 'test-package-id',
        userEmail: 'test@example.com',
        userName: 'Test User'
      });
      console.log('❌ Order creation should have failed but succeeded:', orderResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Order creation correctly failed:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Flow test completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to admin panel and save some Roamify packages');
    console.log('2. Check that packages appear in /api/frontend-packages');
    console.log('3. Test the buy functionality on the frontend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testMyPackagesFlow(); 