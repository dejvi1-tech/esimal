const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function debugFrontendPackages() {
  try {
    console.log('🔍 Checking what packages are returned to frontend...\n');

    // 1. Check frontend-packages endpoint (what user sees)
    console.log('=== FRONTEND PACKAGES ENDPOINT ===');
    try {
      const frontendPackages = await makeRequest('https://esimal.onrender.com/api/frontend-packages');
      console.log(`Total packages returned: ${frontendPackages.length}`);
      
      // Find 1GB packages
      const oneGbPackages = frontendPackages.filter(pkg => 
        pkg.data_amount >= 0.9 && pkg.data_amount <= 1.1
      );
      
      console.log(`\n1GB Packages (${oneGbPackages.length}):`);
      oneGbPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log('   ---');
      });

      // Find Germany packages  
      const germanyPackages = frontendPackages.filter(pkg => 
        pkg.country_name && pkg.country_name.toLowerCase().includes('germany')
      );
      
      console.log(`\nGermany Packages (${germanyPackages.length}):`);
      germanyPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log('   ---');
      });

      // Find Europe & United States packages
      const europeUsPackages = frontendPackages.filter(pkg => 
        pkg.country_name && pkg.country_name.toLowerCase().includes('europe') && 
        pkg.country_name.toLowerCase().includes('united')
      );
      
      console.log(`\nEurope & United States Packages (${europeUsPackages.length}):`);
      europeUsPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log('   ---');
      });

    } catch (error) {
      console.error('Error fetching frontend packages:', error.message);
    }

    // 2. Check search for Germany specifically
    console.log('\n=== SEARCH PACKAGES FOR GERMANY ===');
    try {
      const germanySearch = await makeRequest('https://esimal.onrender.com/api/search-packages?country=Germany');
      console.log(`Germany search returned: ${germanySearch.length} packages`);
      
      germanySearch.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name})`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log('   ---');
      });
    } catch (error) {
      console.error('Error searching Germany packages:', error.message);
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugFrontendPackages(); 