const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAdminSync() {
  console.log('🧪 Testing Admin Panel Sync Functionality\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/admin-auth/login`, {
      username: 'admin',
      password: 'Admin$123456'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get all packages
    console.log('\n2. Fetching all packages...');
    const packagesResponse = await axios.get(`${BASE_URL}/api/packages?limit=10`);
    
    if (packagesResponse.data.data && packagesResponse.data.data.length > 0) {
      console.log(`✅ Found ${packagesResponse.data.data.length} packages`);
      console.log('   Sample packages:');
      packagesResponse.data.data.slice(0, 3).forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} - ${pkg.country_name || pkg.country} - $${pkg.price || pkg.base_price}`);
      });
    } else {
      console.log('❌ No packages found');
      return;
    }

    // Step 3: Get current my_packages
    console.log('\n3. Fetching current my_packages...');
    const myPackagesResponse = await axios.get(`${BASE_URL}/api/admin/my-packages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const currentMyPackages = myPackagesResponse.data || [];
    console.log(`✅ Current my_packages count: ${currentMyPackages.length}`);

    // Step 4: Select some packages to sync
    const packagesToSync = packagesResponse.data.data.slice(0, 2).map(pkg => pkg.id);
    console.log(`\n4. Syncing ${packagesToSync.length} packages...`);
    console.log(`   Package IDs: ${packagesToSync.join(', ')}`);

    const syncResponse = await axios.post(`${BASE_URL}/api/admin/sync-packages`, {
      packageIds: packagesToSync
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (syncResponse.data.success) {
      console.log('✅ Sync successful');
    } else {
      console.log('❌ Sync failed');
      return;
    }

    // Step 5: Verify packages were added to my_packages
    console.log('\n5. Verifying synced packages...');
    const updatedMyPackagesResponse = await axios.get(`${BASE_URL}/api/admin/my-packages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const updatedMyPackages = updatedMyPackagesResponse.data || [];
    console.log(`✅ Updated my_packages count: ${updatedMyPackages.length}`);
    
    if (updatedMyPackages.length > currentMyPackages.length) {
      console.log(`✅ Successfully added ${updatedMyPackages.length - currentMyPackages.length} packages`);
      
      // Show the newly added packages
      const newPackages = updatedMyPackages.filter(pkg => 
        !currentMyPackages.some(existing => existing.id === pkg.id)
      );
      
      console.log('   Newly added packages:');
      newPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} - ${pkg.country_name} - Base: $${pkg.base_price}, Sale: $${pkg.sale_price}, Profit: $${pkg.profit}`);
      });
    } else {
      console.log('⚠️  No new packages were added (they might already exist)');
    }

    // Step 6: Test updating a package price
    if (updatedMyPackages.length > 0) {
      console.log('\n6. Testing package price update...');
      const packageToUpdate = updatedMyPackages[0];
      const newSalePrice = packageToUpdate.sale_price + 1;
      
      console.log(`   Updating ${packageToUpdate.name} sale price from $${packageToUpdate.sale_price} to $${newSalePrice}`);
      
      const updateResponse = await axios.post(`${BASE_URL}/api/admin/save-package`, {
        ...packageToUpdate,
        sale_price: newSalePrice,
        profit: newSalePrice - packageToUpdate.base_price
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.data.success) {
        console.log('✅ Package update successful');
      } else {
        console.log('❌ Package update failed');
      }
    }

    console.log('\n🎉 Admin Panel Sync test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminSync(); 