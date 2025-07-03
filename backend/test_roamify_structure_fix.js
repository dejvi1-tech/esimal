const axios = require('axios');
require('dotenv').config();

async function testRoamifyStructureFix() {
  try {
    console.log('Testing Roamify API response structure fix...');
    
    const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
    const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

    if (!ROAMIFY_API_KEY) {
      console.error('ROAMIFY_API_KEY not set');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('ROAMIFY')));
      return;
    }

    console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');

    // Test the packages endpoint
    const response = await axios.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    const data = response.data;

    console.log('\n=== TESTING RESPONSE STRUCTURE ===');
    console.log('Response type:', typeof data);
    console.log('Top-level keys:', Object.keys(data || {}));
    
    // Test the new structure: data.countries
    if (data && data.data && data.data.countries && Array.isArray(data.data.countries)) {
      console.log('✅ SUCCESS: Found data.countries array');
      console.log(`Found ${data.data.countries.length} countries`);
      
      let totalPackages = 0;
      for (const country of data.data.countries) {
        if (country.packages && Array.isArray(country.packages)) {
          totalPackages += country.packages.length;
          console.log(`- ${country.countryName}: ${country.packages.length} packages`);
        }
      }
      
      console.log(`Total packages found: ${totalPackages}`);
      
      if (totalPackages > 0) {
        console.log('✅ SUCCESS: Found packages in the correct structure');
        
        // Show sample package
        const firstCountry = data.data.countries[0];
        if (firstCountry.packages && firstCountry.packages.length > 0) {
          const samplePackage = firstCountry.packages[0];
          console.log('\nSample package structure:');
          console.log('- packageId:', samplePackage.packageId);
          console.log('- package:', samplePackage.package);
          console.log('- validity_days:', samplePackage.validity_days);
          console.log('- price:', samplePackage.price);
          console.log('- dataAmount:', samplePackage.dataAmount);
          console.log('- dataUnit:', samplePackage.dataUnit);
        }
      } else {
        console.log('⚠️ WARNING: No packages found in countries');
      }
    } else {
      console.log('❌ ERROR: Expected data.countries structure not found');
      console.log('Actual structure:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Error testing Roamify structure fix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRoamifyStructureFix(); 