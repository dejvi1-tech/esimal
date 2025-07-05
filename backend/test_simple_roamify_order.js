const axios = require('axios');

// Simple createEsimOrder function matching the exact specification
async function createEsimOrder(roamifySlug, customer) {
  const url = 'https://api.getroamify.com/api/esim/order';
  const body = {
    // **must** be an array called "items"
    items: [
      {
        packageId: roamifySlug,  // e.g. 'esim-gr-30days-1gb-all'
        quantity: 1
      }
    ]
  };

  // send it exactly like this—no extra top‑level fields!
  const resp = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return resp.data;
}

// Test function
async function testCreateEsimOrder() {
  console.log('🧪 Testing Simple Roamify eSIM Order Creation...\n');

  if (!process.env.ROAMIFY_API_KEY) {
    console.error('❌ ROAMIFY_API_KEY not set');
    process.exit(1);
  }

  console.log('🔑 API Key (first 10 chars):', process.env.ROAMIFY_API_KEY.substring(0, 10) + '...');

  try {
    // First, get available packages to find a valid slug
    console.log('\n1. Getting available packages to find a valid slug...');
    const packagesResponse = await axios.get('https://api.getroamify.com/api/packages', {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const countries = packagesResponse.data.data?.packages || [];
    const allPackages = countries.flatMap(country => (country.packages || []).map(pkg => ({
      ...pkg,
      countryName: country.countryName
    })));

    if (allPackages.length === 0) {
      console.log('❌ No packages found');
      return;
    }

    const testSlug = allPackages[0].packageId;
    console.log(`✅ Found test slug: ${testSlug}`);

    // Test the createEsimOrder function
    console.log('\n2. Testing createEsimOrder function...');
    console.log(`   Slug: ${testSlug}`);
    console.log('   Payload structure: { items: [{ packageId, quantity: 1 }] }');

    const result = await createEsimOrder(testSlug, { /* customer data */ });
    
    console.log('\n✔️ Roamify order created successfully!');
    console.log('📄 Response:', JSON.stringify(result, null, 2));
    
    // Extract key information
    const data = result.data || result;
    const orderId = data.orderId || data.id || data.order_id;
    const esimId = data.items?.[0]?.esimId || data.esimId || data.iccid;
    
    console.log(`\n📋 Order ID: ${orderId}`);
    console.log(`📱 eSIM ID: ${esimId}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (err) {
    console.error('\n❌ Roamify order creation failed:', err.response?.data || err.message);
    
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      console.log('Response data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

// Run the test
testCreateEsimOrder().catch(console.error); 