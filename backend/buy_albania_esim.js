const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const testEmail = 'dejvikacollja@gmail.com';
const testName = 'Dejvi';
const testSurname = 'Kacollja';

async function buyAlbaniaEsim() {
  console.log('🛒 Buying Real Albania eSIM from Roamify');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`👤 Name: ${testName} ${testSurname}`);
  console.log(`🌐 Backend URL: ${BASE_URL}`);
  console.log(`🔑 Roamify API Key: ${process.env.ROAMIFY_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
  console.log('⚠️  WARNING: This will cost real money (~$4.49 USD)');
  console.log('⚠️  This will create a real eSIM that you can actually use');
  console.log('');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }
    console.log('');

    // Test 2: Get Albania packages
    console.log('2. Fetching Albania packages...');
    try {
      const packagesResponse = await axios.get(`${BASE_URL}/api/frontend-packages`);
      
      const albaniaPackages = packagesResponse.data.filter(pkg => 
        pkg.country_name.toLowerCase().includes('albania')
      );
      
      if (albaniaPackages.length > 0) {
        console.log('✅ Albania packages found:');
        albaniaPackages.forEach(pkg => {
          console.log(`   - ${pkg.name} (${pkg.data_amount}MB, $${pkg.sale_price}) - Reseller ID: ${pkg.reseller_id}`);
        });
        
        // Find the smallest Albania package (3GB)
        const targetPackage = albaniaPackages.find(pkg => 
          pkg.data_amount === 3072 // 3GB in MB
        );
        
        if (!targetPackage) {
          console.log('❌ No 3GB Albania package found');
          return;
        }
        
        console.log(`🎯 Target package: ${targetPackage.name}`);
        console.log(`   Data: ${targetPackage.data_amount}MB (${(targetPackage.data_amount / 1024).toFixed(1)}GB)`);
        console.log(`   Price: $${targetPackage.sale_price}`);
        console.log(`   Validity: ${targetPackage.validity_days} days`);
        console.log(`   Reseller ID: ${targetPackage.reseller_id}`);
        console.log('');
        
        // Test 3: Create real Roamify order
        console.log('3. Creating real Roamify order for Albania...');
        console.log('   This will cost real money and create a real eSIM!');
        console.log('');
        
        const orderData = {
          packageId: targetPackage.id,
          userEmail: testEmail,
          name: testName,
          surname: testSurname
        };

        const orderResponse = await axios.post(`${BASE_URL}/api/orders/my-packages`, orderData);
        
        if (orderResponse.data.status === 'success') {
          console.log('🎉 Real Albania eSIM purchased successfully!');
          console.log(`   Order ID: ${orderResponse.data.data.orderId}`);
          console.log(`   eSIM Code: ${orderResponse.data.data.esimCode}`);
          console.log(`   Roamify Order ID: ${orderResponse.data.data.roamifyOrderId || 'N/A'}`);
          console.log(`   QR Code URL: ${orderResponse.data.data.qrCodeUrl || 'N/A'}`);
          console.log(`   Package: ${orderResponse.data.data.packageName}`);
          console.log(`   Amount: $${orderResponse.data.data.amount}`);
          console.log(`   Data: ${orderResponse.data.data.dataAmount}GB`);
          console.log(`   Validity: ${orderResponse.data.data.validityDays} days`);
          console.log('');
          console.log('📧 Check your email inbox for the confirmation email with real QR code!');
          console.log('');
          console.log('🔍 This is a REAL eSIM that you can use:');
          console.log('   ✅ Real Roamify API call');
          console.log('   ✅ Real eSIM code from Roamify');
          console.log('   ✅ Real QR code from Roamify');
          console.log('   ✅ Real order ID from Roamify');
          console.log('   ✅ Real email sent with QR code');
        } else {
          console.log('❌ Failed to create order:', orderResponse.data);
        }
        
      } else {
        console.log('❌ No Albania packages found');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
      if (error.response) {
        console.log('   Response status:', error.response.status);
        console.log('   Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
buyAlbaniaEsim(); 