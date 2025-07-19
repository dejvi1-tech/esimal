const axios = require('axios');

const API_URL = 'https://esimal.onrender.com';
const LOCAL_API_URL = 'http://localhost:8000';

async function testClientSideFlow() {
  console.log('🔍 Testing Client-Side Buying Flow\n');
  
  try {
    // 1. Test frontend-packages endpoint
    console.log('1️⃣ Testing /api/frontend-packages endpoint...');
    const packagesResponse = await axios.get(`${API_URL}/api/frontend-packages`);
    console.log(`✅ Found ${packagesResponse.data.length} packages`);
    
    if (packagesResponse.data.length > 0) {
      console.log('\n📦 Sample packages:');
      packagesResponse.data.slice(0, 3).forEach(pkg => {
        console.log(`  - ${pkg.name}`);
        console.log(`    ID: ${pkg.id}`);
        console.log(`    Country: ${pkg.country_name}`);
        console.log(`    Data: ${pkg.data_amount}GB`);
        console.log(`    Days: ${pkg.days}`);
        console.log(`    Price: €${pkg.sale_price}`);
        console.log(`    Reseller ID: ${pkg.reseller_id || 'N/A'}`);
        console.log('');
      });
    }
    
    // 2. Test get-section-packages for most-popular
    console.log('\n2️⃣ Testing /api/packages/get-section-packages?slug=most-popular...');
    const mostPopularResponse = await axios.get(`${API_URL}/api/packages/get-section-packages?slug=most-popular`);
    console.log(`✅ Found ${mostPopularResponse.data.length} most popular packages`);
    
    if (mostPopularResponse.data.length > 0) {
      console.log('\n🌟 Most Popular packages:');
      mostPopularResponse.data.forEach(pkg => {
        console.log(`  - ${pkg.name}`);
        console.log(`    Location slug: ${pkg.location_slug}`);
        console.log(`    Homepage order: ${pkg.homepage_order}`);
        console.log(`    Slug: ${pkg.slug || 'N/A'}`);
        console.log(`    Features: ${JSON.stringify(pkg.features?.packageId) || 'N/A'}`);
        console.log('');
      });
    }
    
    // 3. Test country-specific packages
    console.log('\n3️⃣ Testing country-specific packages...');
    const countries = ['albania', 'germany', 'italy', 'greece'];
    
    for (const country of countries) {
      const countryResponse = await axios.get(`${API_URL}/api/packages/get-section-packages?slug=${country}`);
      console.log(`  ${country}: ${countryResponse.data.length} packages found`);
    }
    
    // 4. Verify package structure for checkout
    console.log('\n4️⃣ Verifying package structure for checkout...');
    if (packagesResponse.data.length > 0) {
      const testPackage = packagesResponse.data[0];
      console.log('✅ Package structure check:');
      console.log(`  - Has ID: ${!!testPackage.id}`);
      console.log(`  - Has name: ${!!testPackage.name}`);
      console.log(`  - Has sale_price: ${!!testPackage.sale_price && typeof testPackage.sale_price === 'number'}`);
      console.log(`  - Has data_amount: ${!!testPackage.data_amount && typeof testPackage.data_amount === 'number'}`);
      console.log(`  - Has days: ${!!testPackage.days && typeof testPackage.days === 'number'}`);
      console.log(`  - Has country_name: ${!!testPackage.country_name}`);
      
      // 5. Test checkout flow (without actual payment)
      console.log('\n5️⃣ Testing checkout data preparation...');
      const checkoutData = {
        packageId: testPackage.id,
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        country_code: 'AL', // Example country code
        amount: testPackage.sale_price
      };
      
      console.log('✅ Checkout data ready:');
      console.log(`  - Package: ${testPackage.name}`);
      console.log(`  - Price: €${checkoutData.amount}`);
      console.log(`  - Package ID: ${checkoutData.packageId}`);
      
      // Check if package has necessary Roamify integration data
      console.log('\n🔗 Roamify Integration Check:');
      const hasRoamifyPackageId = testPackage.features?.packageId || testPackage.reseller_id;
      const hasSlug = testPackage.slug;
      console.log(`  - Has Roamify Package ID: ${!!hasRoamifyPackageId} (${hasRoamifyPackageId || 'Missing'})`);
      console.log(`  - Has Slug: ${!!hasSlug} (${hasSlug || 'Missing'})`);
      
      if (!hasRoamifyPackageId && !hasSlug) {
        console.log('  ⚠️  WARNING: Package missing Roamify integration data!');
      } else {
        console.log('  ✅ Package has necessary Roamify integration data');
      }
    }
    
    // 6. Summary
    console.log('\n📊 Summary:');
    console.log(`  - Total packages available: ${packagesResponse.data.length}`);
    console.log(`  - Most popular packages: ${mostPopularResponse.data.length}`);
    console.log(`  - All packages visible: ${packagesResponse.data.every(p => p.visible !== false)}`);
    console.log(`  - All packages have prices: ${packagesResponse.data.every(p => p.sale_price > 0)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testClientSideFlow(); 