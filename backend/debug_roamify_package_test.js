const axios = require('axios');

// Environment check
if (!process.env.ROAMIFY_API_KEY) {
  console.error('❌ Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_BASE_URL = 'https://api.getroamify.com';

async function testRoamifyPackages() {
  console.log('🧪 Testing Roamify package IDs...\n');
  
  // Test different package IDs that might work
  const testPackages = [
    'esim-zambia-5days-5gb-all',
    'esim-europe-30days-3gb-all',
    'esim-global-30days-3gb-all',
    'esim-united-states-30days-3gb-all',
    'esim-spain-30days-1gb-all',
    'esim-germany-30days-1gb-all',
    'esim-italy-30days-1gb-all',
    'esim-france-30days-1gb-all',
    'esim-uk-30days-1gb-all',
    'esim-canada-30days-1gb-all'
  ];
  
  for (const packageId of testPackages) {
    console.log(`\n🔍 Testing package ID: ${packageId}`);
    
    const payload = {
      items: [
        {
          packageId: packageId,
          quantity: 1
        }
      ]
    };
    
    const headers = {
      'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'esim-marketplace/1.0.0'
    };
    
    try {
      console.log(`📤 Sending request to: ${ROAMIFY_BASE_URL}/api/esim/order`);
      console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${ROAMIFY_BASE_URL}/api/esim/order`,
        payload,
        {
          headers,
          timeout: 30000
        }
      );
      
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
      
      // If this works, we found a good package ID
      console.log(`🎉 Package ID ${packageId} WORKS!`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED! Status: ${error.response.status}`);
        console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 500) {
          console.log(`💥 500 ERROR - Package ID ${packageId} is INVALID`);
        } else if (error.response.status === 400) {
          console.log(`⚠️ 400 ERROR - Package ID ${packageId} might be invalid or missing`);
        } else if (error.response.status === 401) {
          console.log(`🔐 401 ERROR - Authentication issue`);
        } else if (error.response.status === 404) {
          console.log(`🔍 404 ERROR - Endpoint not found`);
        }
      } else {
        console.log(`❌ NETWORK ERROR:`, error.message);
      }
    }
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Package testing completed!');
}

// Run the test
testRoamifyPackages()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 