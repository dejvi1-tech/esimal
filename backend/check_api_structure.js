const axios = require('axios');

// Roamify API configuration
const ROAMIFY_API_URL = 'https://api.getroamify.com';
const ROAMIFY_API_KEY = 'WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN';

async function checkApiStructure() {
  console.log('🔍 Checking Roamify API response structure...\n');

  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response Structure:');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Data keys:', Object.keys(response.data));
    
    if (response.data.countries) {
      console.log('Countries array length:', response.data.countries.length);
      if (response.data.countries.length > 0) {
        console.log('First country structure:', Object.keys(response.data.countries[0]));
        console.log('First country:', JSON.stringify(response.data.countries[0], null, 2));
      }
    }

    // Look for any packages in the response
    console.log('\n🔍 Searching for packages in response...');
    
    function findPackages(obj, path = '') {
      const packages = [];
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (item && typeof item === 'object') {
            packages.push(...findPackages(item, `${path}[${index}]`));
          }
        });
      } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          
          if (key === 'packages' && Array.isArray(obj[key])) {
            console.log(`Found packages array at: ${newPath}`);
            packages.push(...obj[key]);
          } else if (obj[key] && typeof obj[key] === 'object') {
            packages.push(...findPackages(obj[key], newPath));
          }
        });
      }
      
      return packages;
    }
    
    const allPackages = findPackages(response.data);
    console.log(`\n📦 Found ${allPackages.length} packages in response`);
    
    if (allPackages.length > 0) {
      console.log('First package structure:', Object.keys(allPackages[0]));
      console.log('First package:', JSON.stringify(allPackages[0], null, 2));
      
      // Look for Europe/US packages
      const europeUsPackages = allPackages.filter(pkg => 
        pkg.packageId && (
          pkg.packageId.toLowerCase().includes('europe') ||
          pkg.packageId.toLowerCase().includes('us') ||
          pkg.packageId.toLowerCase().includes('global')
        )
      );
      
      console.log(`\n🌍 Found ${europeUsPackages.length} Europe/US packages:`);
      europeUsPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.packageId} - ${pkg.package || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkApiStructure(); 