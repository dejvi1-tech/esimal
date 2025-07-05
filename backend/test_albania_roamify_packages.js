const axios = require('axios');
require('dotenv').config();

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testAlbaniaRoamifyPackages() {
  console.log('🔍 Testing Albania package IDs with Roamify API...\n');

  // Test different possible Albania package ID formats
  const testCases = [
    // Format: esim-albania-{days}days-{data}gb-all
    { packageId: "esim-albania-30days-3gb-all", description: "Albania 3GB 30 days" },
    { packageId: "esim-albania-30days-10gb-all", description: "Albania 10GB 30 days" },
    { packageId: "esim-albania-30days-20gb-all", description: "Albania 20GB 30 days" },
    
    // Format: esim-al-{days}days-{data}gb-all (like Greece was using gr)
    { packageId: "esim-al-30days-3gb-all", description: "Albania 3GB 30 days (short code)" },
    { packageId: "esim-al-30days-10gb-all", description: "Albania 10GB 30 days (short code)" },
    { packageId: "esim-al-30days-20gb-all", description: "Albania 20GB 30 days (short code)" },
    
    // Format: esim-albania-{data}gb-{days}days
    { packageId: "esim-albania-3gb-30days", description: "Albania 3GB 30 days (reversed)" },
    { packageId: "esim-albania-10gb-30days", description: "Albania 10GB 30 days (reversed)" },
    
    // Format: esim-albania-{data}gb-{days}days-all
    { packageId: "esim-albania-3gb-30days-all", description: "Albania 3GB 30 days with -all suffix" },
    { packageId: "esim-albania-10gb-30days-all", description: "Albania 10GB 30 days with -all suffix" },
  ];

  console.log(`🧪 Testing ${testCases.length} different Albania package ID formats...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📦 Test ${i + 1}: ${testCase.description}`);
    console.log(`   Package ID: ${testCase.packageId}`);

    const testPayload = {
      items: [
        {
          packageId: testCase.packageId,
          quantity: 1
        }
      ]
    };

    try {
      const response = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'esim-marketplace/1.0.0'
        },
        timeout: 30000,
      });

      console.log(`   ✅ SUCCESS! Status: ${response.status}`);
      console.log(`   📊 Response: ${JSON.stringify(response.data, null, 2)}`);
      
      // If we get here, we found a working format!
      console.log(`\n🎉 FOUND WORKING ALBANIA PACKAGE ID FORMAT: ${testCase.packageId}`);
      console.log(`   Description: ${testCase.description}`);
      
      // Extract key info
      const orderData = response.data.data;
      const esimId = orderData.items[0]?.esimId;
      const orderId = orderData.id;
      
      console.log(`   Order ID: ${orderId}`);
      console.log(`   eSIM ID: ${esimId}`);
      console.log(`   Status: ${orderData.status}`);
      console.log(`   Total: $${orderData.total} ${orderData.currency}`);
      
      return {
        success: true,
        workingFormat: testCase.packageId,
        description: testCase.description,
        orderData: response.data
      };

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    console.log(''); // Empty line between tests
  }

  console.log('❌ No working Albania package ID format found');
  return { success: false };
}

// Run the test
testAlbaniaRoamifyPackages().then(result => {
  if (result.success) {
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Found working Albania package ID format: ${result.workingFormat}`);
    console.log(`✅ Description: ${result.description}`);
    console.log('✅ This format can be used to fix the missing slugs');
  } else {
    console.log('\n📋 SUMMARY:');
    console.log('❌ No working Albania package ID format found');
    console.log('❌ Need to investigate further or contact Roamify support');
  }
}).catch(console.error); 