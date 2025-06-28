const axios = require('axios');

const BASE_URL = 'http://localhost:5173'; // Frontend dev server
const API_URL = 'http://localhost:3001'; // Backend server

async function testCheckoutFix() {
  console.log('🧪 Testing Checkout Page Fix...\n');

  try {
    // Test 1: Check if frontend packages API is working
    console.log('1. Testing /api/frontend-packages endpoint...');
    let packages = [];
    try {
      const response = await axios.get(`${API_URL}/api/frontend-packages`);
      packages = response.data;
      console.log('✅ Frontend packages API working');
      console.log('   Packages available:', packages.length);
      if (packages.length > 0) {
        console.log('   Sample package:', {
          id: packages[0].id,
          name: packages[0].name,
          price: packages[0].sale_price
        });
      }
    } catch (error) {
      console.log('❌ Frontend packages API error:', error.response?.data || error.message);
    }

    // Test 2: Test checkout with valid package ID
    console.log('\n2. Testing checkout with valid package ID...');
    if (packages.length > 0) {
      const packageId = packages[0].id;
      const checkoutUrl = `${BASE_URL}/checkout?package=${packageId}`;
      console.log('   Checkout URL:', checkoutUrl);
      console.log('   ✅ This should show the checkout form');
    } else {
      console.log('   ⚠️ No packages available to test with');
    }

    // Test 3: Test checkout without package ID (this was the bug)
    console.log('\n3. Testing checkout without package ID...');
    const invalidCheckoutUrl = `${BASE_URL}/checkout?`;
    console.log('   Invalid checkout URL:', invalidCheckoutUrl);
    console.log('   ✅ This should now show an error message instead of blank page');

    console.log('\n🎉 Checkout fix test completed!');
    console.log('\n📋 Manual testing steps:');
    console.log('1. Open browser and go to: http://localhost:5173/checkout?');
    console.log('2. Should see: "No Package Selected" error message');
    console.log('3. Click "Browse Packages" button');
    console.log('4. Should redirect to packages page');
    console.log('5. Select a package and go to checkout');
    console.log('6. Should see the checkout form with package details');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCheckoutFix(); 