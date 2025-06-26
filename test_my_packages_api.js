const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testMyPackagesAPI() {
  console.log('🧪 Testing My Packages API...\n');

  try {
    // Test 1: Get frontend packages
    console.log('1. Testing GET /api/frontend-packages...');
    try {
      const response = await axios.get(`${BASE_URL}/api/frontend-packages`);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Save a test package
    console.log('\n2. Testing POST /api/admin/save-package...');
    try {
      const testPackage = {
        reseller_id: 'test_package_001',
        country: 'United States',
        name: 'Test eSIM Package',
        data: 5.0,
        days: 30,
        base_price: 15.0,
        sale_price: 19.99,
        visible: true,
        region: 'North America'
      };

      const response = await axios.post(`${BASE_URL}/api/admin/save-package`, testPackage);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Create an order (this will fail without a real package ID, but we can test the endpoint)
    console.log('\n3. Testing POST /api/order...');
    try {
      const response = await axios.post(`${BASE_URL}/api/order`, {
        packageId: 'test-package-id'
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no real package):', error.response?.data || error.message);
    }

    console.log('\n🎉 API tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Create the my_packages table in Supabase');
    console.log('2. Add some packages via the admin panel');
    console.log('3. Test the frontend buy flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start your backend server first:');
    console.log('   cd backend && npm run dev');
    return false;
  }
}

async function runTests() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testMyPackagesAPI();
  }
}

runTests(); 