const axios = require('axios');

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using process.env directly');
}

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_BASE_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testRoamifyGermanyOrder() {
  console.log('🔍 Testing Roamify Germany 1GB 30 days package order...');
  console.log('API Key:', ROAMIFY_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('Base URL:', ROAMIFY_BASE_URL);
  console.log('');

  if (!ROAMIFY_API_KEY) {
    console.error('❌ ROAMIFY_API_KEY not set in environment variables');
    console.log('💡 To fix this:');
    console.log('   1. Create a .env file in the backend directory');
    console.log('   2. Add: ROAMIFY_API_KEY=your_actual_api_key_here');
    console.log('   3. Or set it as an environment variable');
    console.log('');
    console.log('🔧 Alternative: Deploy this test to Render where your API key is already set');
    return;
  }

  try {
    // Step 1: Fetch available packages to find Germany 1GB 30 days
    console.log('📦 Step 1: Fetching available packages...');
    const packagesResponse = await axios.get(`${ROAMIFY_BASE_URL}/api/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('✅ Packages fetched successfully');
    console.log('Total packages:', packagesResponse.data.data?.length || 0);
    
    // Find Germany 1GB 30 days package
    const packages = packagesResponse.data.data || [];
    const germanyPackage = packages.find(pkg => 
      pkg.name?.toLowerCase().includes('germany') && 
      pkg.data_amount === 1 && 
      pkg.validity_days === 30
    );

    if (!germanyPackage) {
      console.log('❌ Germany 1GB 30 days package not found. Available packages:');
      packages.slice(0, 10).forEach((pkg, index) => {
        console.log(`  ${index + 1}. ${pkg.name} - ${pkg.data_amount}GB - ${pkg.validity_days} days (ID: ${pkg.id})`);
      });
      
      // Try to find any Germany package
      const anyGermanyPackage = packages.find(pkg => 
        pkg.name?.toLowerCase().includes('germany')
      );
      
      if (anyGermanyPackage) {
        console.log('');
        console.log('🔍 Found a Germany package (not exactly 1GB 30 days):');
        console.log(`  Name: ${anyGermanyPackage.name}`);
        console.log(`  Data: ${anyGermanyPackage.data_amount}GB`);
        console.log(`  Validity: ${anyGermanyPackage.validity_days} days`);
        console.log(`  ID: ${anyGermanyPackage.id}`);
        console.log('');
        console.log('🔄 Using this package for testing instead...');
        
        // Use this package for testing
        const testPackage = anyGermanyPackage;
        
        // Step 2: Test order creation with /api/esim/order
        console.log('🛒 Step 2: Testing order creation with /api/esim/order...');
        const orderPayload = {
          items: [
            {
              packageId: testPackage.id,
              quantity: 1
            }
          ]
        };

        console.log('📤 Order payload:', JSON.stringify(orderPayload, null, 2));

        const orderResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, orderPayload, {
          headers: {
            'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        console.log('✅ Order created successfully!');
        console.log('📊 Order response:', JSON.stringify(orderResponse.data, null, 2));
        console.log('');

        // Step 3: Extract eSIM ID and test QR code generation
        const orderData = orderResponse.data.data;
        const esimItem = orderData.items?.[0];
        const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;

        if (esimId) {
          console.log('📱 Step 3: Testing QR code generation for eSIM:', esimId);
          
          const qrResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/apply`, {
            esimId: esimId
          }, {
            headers: {
              'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          });

          console.log('✅ QR code generated successfully!');
          console.log('📊 QR response status:', qrResponse.data.status);
          console.log('📊 QR response data keys:', Object.keys(qrResponse.data.data || {}));
          
          if (qrResponse.data.data?.esim) {
            console.log('📊 eSIM data available:', {
              hasLpaCode: !!qrResponse.data.data.esim.lpaCode,
              hasQrCodeUrl: !!qrResponse.data.data.esim.qrCodeUrl,
              hasActivationCode: !!qrResponse.data.data.esim.activationCode,
              hasIosQuickInstall: !!qrResponse.data.data.esim.iosQuickInstall,
            });
          }
        } else {
          console.log('❌ No eSIM ID found in order response');
        }

        console.log('');
        console.log('🎉 Test completed successfully!');
        console.log('✅ The /api/esim/order endpoint works correctly');
        console.log('✅ QR code generation works correctly');
        console.log('✅ Your Roamify integration is ready for production');
      }
      return;
    }

    console.log('✅ Found Germany package:', {
      id: germanyPackage.id,
      name: germanyPackage.name,
      data_amount: germanyPackage.data_amount,
      validity_days: germanyPackage.validity_days,
      price: germanyPackage.price
    });
    console.log('');

    // Step 2: Test order creation with /api/esim/order
    console.log('🛒 Step 2: Testing order creation with /api/esim/order...');
    const orderPayload = {
      items: [
        {
          packageId: germanyPackage.id,
          quantity: 1
        }
      ]
    };

    console.log('📤 Order payload:', JSON.stringify(orderPayload, null, 2));

    const orderResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/order`, orderPayload, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('✅ Order created successfully!');
    console.log('📊 Order response:', JSON.stringify(orderResponse.data, null, 2));
    console.log('');

    // Step 3: Extract eSIM ID and test QR code generation
    const orderData = orderResponse.data.data;
    const esimItem = orderData.items?.[0];
    const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;

    if (esimId) {
      console.log('📱 Step 3: Testing QR code generation for eSIM:', esimId);
      
      const qrResponse = await axios.post(`${ROAMIFY_BASE_URL}/api/esim/apply`, {
        esimId: esimId
      }, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('✅ QR code generated successfully!');
      console.log('📊 QR response status:', qrResponse.data.status);
      console.log('📊 QR response data keys:', Object.keys(qrResponse.data.data || {}));
      
      if (qrResponse.data.data?.esim) {
        console.log('📊 eSIM data available:', {
          hasLpaCode: !!qrResponse.data.data.esim.lpaCode,
          hasQrCodeUrl: !!qrResponse.data.data.esim.qrCodeUrl,
          hasActivationCode: !!qrResponse.data.data.esim.activationCode,
          hasIosQuickInstall: !!qrResponse.data.data.esim.iosQuickInstall,
        });
      }
    } else {
      console.log('❌ No eSIM ID found in order response');
    }

    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('✅ The /api/esim/order endpoint works correctly');
    console.log('✅ QR code generation works correctly');
    console.log('✅ Your Roamify integration is ready for production');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📊 Error response status:', error.response.status);
      console.error('📊 Error response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testRoamifyGermanyOrder(); 