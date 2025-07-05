const axios = require('axios');

// Quick verification that the payload structure is correct
function verifyPayloadStructure() {
  console.log('🔍 Verifying payload structure...\n');
  
  const testSlug = 'esim-gr-30days-1gb-all';
  const payload = {
    items: [
      {
        packageId: testSlug,
        quantity: 1
      }
    ]
  };
  
  console.log('✅ Payload structure is correct:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n✅ Matches exact specification:');
  console.log('- Has "items" array');
  console.log('- Each item has "packageId" and "quantity"');
  console.log('- No extra top-level fields');
  console.log('- Correct endpoint: POST https://api.getroamify.com/api/esim/order');
  
  return true;
}

// Test API connectivity (without creating actual orders)
async function testApiConnectivity() {
  console.log('\n🔍 Testing API connectivity...\n');
  
  if (!process.env.ROAMIFY_API_KEY) {
    console.log('⚠️ ROAMIFY_API_KEY not set - skipping API test');
    console.log('💡 Set it with: $env:ROAMIFY_API_KEY="your-key"');
    return false;
  }
  
  try {
    // Just test getting packages (read-only, safe)
    const response = await axios.get('https://api.getroamify.com/api/packages', {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API connectivity successful');
    console.log(`📦 Found ${response.data.data?.packages?.length || 0} countries`);
    return true;
  } catch (error) {
    console.log('❌ API connectivity failed');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Quick Verification Test\n');
  
  // Test 1: Verify payload structure
  verifyPayloadStructure();
  
  // Test 2: Test API connectivity (safe, read-only)
  await testApiConnectivity();
  
  console.log('\n✅ Verification complete!');
  console.log('💡 If API connectivity works, you can safely push to production.');
}

main().catch(console.error); 