const axios = require('axios');

async function verifyFrontendData() {
  try {
    console.log('🔍 Verifying frontend package data...\n');

    // Test the packages API endpoint
    const baseURL = 'http://localhost:5000'; // Adjust if different
    const apiURL = `${baseURL}/api/packages`;
    
    console.log(`📡 Testing API endpoint: ${apiURL}`);
    
    const response = await axios.get(apiURL);
    const packages = response.data;
    
    console.log(`✅ Successfully fetched ${packages.length} packages\n`);
    
    // Check for problematic data amounts
    const problemPackages = packages.filter(pkg => 
      pkg.data_amount > 100 || // Still massive amounts
      pkg.data_amount === 1024 || // Double-converted 1GB
      pkg.data_amount === 3072 || // Double-converted 3GB
      pkg.data_amount === 5120 || // Double-converted 5GB
      pkg.data_amount === 10240 || // Double-converted 10GB
      pkg.data_amount === 20480 || // Double-converted 20GB
      pkg.data_amount === 30720 || // Double-converted 30GB
      pkg.data_amount === 51200    // Double-converted 50GB
    );
    
    if (problemPackages.length > 0) {
      console.log(`❌ Found ${problemPackages.length} packages with problematic data amounts:`);
      problemPackages.forEach(pkg => {
        console.log(`  - ${pkg.name} (${pkg.country_name}): ${pkg.data_amount}GB`);
      });
    } else {
      console.log('✅ No packages with problematic data amounts found!');
    }
    
    // Check specific Germany packages
    console.log('\n🇩🇪 Germany packages:');
    const germanyPackages = packages.filter(pkg => 
      pkg.country_name === 'Germany' || 
      pkg.name.includes('Germany')
    );
    
    germanyPackages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.data_amount}GB - $${pkg.sale_price}`);
    });
    
    // Check Europe & United States packages
    console.log('\n🇪🇺🇺🇸 Europe & United States packages:');
    const europeUSPackages = packages.filter(pkg => 
      pkg.country_name === 'Europe & United States' ||
      pkg.name.includes('Europe & United States')
    );
    
    europeUSPackages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.data_amount}GB - $${pkg.sale_price} (Country: ${pkg.country_name})`);
    });
    
    // Check for country labeling issues
    console.log('\n🏷️ Country labeling issues:');
    const labelingIssues = packages.filter(pkg => 
      pkg.name.includes('Europe & United States') && 
      pkg.country_name !== 'Europe & United States'
    );
    
    if (labelingIssues.length > 0) {
      console.log(`❌ Found ${labelingIssues.length} packages with country labeling issues:`);
      labelingIssues.forEach(pkg => {
        console.log(`  - ${pkg.name} has country_name: "${pkg.country_name}" (should be "Europe & United States")`);
      });
    } else {
      console.log('✅ No country labeling issues found!');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total packages: ${packages.length}`);
    console.log(`  Packages with data amount issues: ${problemPackages.length}`);
    console.log(`  Germany packages: ${germanyPackages.length}`);
    console.log(`  Europe & United States packages: ${europeUSPackages.length}`);
    console.log(`  Country labeling issues: ${labelingIssues.length}`);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running on localhost:5000');
      console.log('Please start the backend server first with: npm start');
    } else {
      console.error('❌ Error verifying frontend data:', error.message);
    }
  }
}

// Run the verification
verifyFrontendData().then(() => {
  console.log('\n🎉 Frontend data verification completed!');
}).catch(error => {
  console.error('❌ Verification failed:', error);
}); 