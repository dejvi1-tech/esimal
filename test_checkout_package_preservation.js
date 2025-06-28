const axios = require('axios');

const BASE_URL = 'http://localhost:5173'; // Frontend dev server
const API_URL = 'http://localhost:3001'; // Backend server

async function testCheckoutPackagePreservation() {
  console.log('🧪 Testing Checkout Package Preservation...\n');

  try {
    // Test 1: Get a valid package ID
    console.log('1. Getting a valid package ID...');
    const response = await axios.get(`${API_URL}/api/frontend-packages`);
    const packages = response.data;
    
    if (packages.length === 0) {
      console.log('❌ No packages available for testing');
      return;
    }
    
    const testPackage = packages[0];
    console.log('✅ Test package found:', {
      id: testPackage.id,
      name: testPackage.name,
      price: testPackage.sale_price
    });

    // Test 2: Test the checkout URL with package ID
    console.log('\n2. Testing checkout URL with package ID...');
    const checkoutUrl = `${BASE_URL}/checkout?package=${testPackage.id}`;
    console.log('   Checkout URL:', checkoutUrl);
    console.log('   ✅ This should show the checkout form with package details');

    // Test 3: Test payment intent creation
    console.log('\n3. Testing payment intent creation...');
    try {
      const paymentIntentResponse = await axios.post(`${API_URL}/api/payments/create-intent`, {
        amount: testPackage.sale_price,
        currency: 'eur',
        email: 'test@example.com',
        packageId: testPackage.id
      });
      
      console.log('✅ Payment intent created successfully');
      console.log('   Client secret received:', !!paymentIntentResponse.data.data.clientSecret);
      console.log('   Payment intent ID:', paymentIntentResponse.data.data.paymentIntentId);
    } catch (error) {
      console.log('❌ Payment intent creation failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Package preservation test completed!');
    console.log('\n📋 Manual testing steps:');
    console.log('1. Open browser and go to:', checkoutUrl);
    console.log('2. Fill in the form details');
    console.log('3. Submit payment');
    console.log('4. Check browser console for [DEBUG] logs');
    console.log('5. Verify package ID is preserved throughout the process');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCheckoutPackagePreservation(); 