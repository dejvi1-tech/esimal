const axios = require('axios');

async function testGermanyPackages() {
  try {
    console.log('🧪 Testing Germany packages endpoint...\n');

    // Use port 3000
    const response = await axios.get('http://localhost:3000/api/search-packages?country=DE');
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Total packages returned:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('\n📦 Packages for Germany:');
      response.data.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name}`);
        console.log(`      Data: ${pkg.data_amount}MB, Validity: ${pkg.validity_days} days`);
        console.log(`      Price: $${pkg.sale_price}, ID: ${pkg.id}`);
        console.log(`      Country: ${pkg.country_name} (${pkg.country_code})`);
        console.log('');
      });

      // Check for duplicates in the response
      const duplicateCheck = {};
      response.data.forEach(pkg => {
        const key = `${pkg.country_name}-${pkg.data_amount}-${pkg.validity_days}-${pkg.sale_price}`;
        if (!duplicateCheck[key]) {
          duplicateCheck[key] = [];
        }
        duplicateCheck[key].push(pkg);
      });

      const duplicates = Object.entries(duplicateCheck)
        .filter(([key, packages]) => packages.length > 1);

      if (duplicates.length > 0) {
        console.log('❌ Found duplicates in API response:');
        duplicates.forEach(([key, packages]) => {
          console.log(`   ${key}: ${packages.length} packages`);
          packages.forEach(pkg => {
            console.log(`     - ID: ${pkg.id}`);
          });
        });
      } else {
        console.log('✅ No duplicates found in API response!');
      }
    } else {
      console.log('⚠️  No packages found for Germany');
    }

  } catch (error) {
    console.error('❌ Error testing Germany packages:', error.response?.data || error.message);
  }
}

testGermanyPackages(); 