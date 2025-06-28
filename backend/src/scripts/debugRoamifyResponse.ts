import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

async function debugRoamifyResponse() {
  if (!ROAMIFY_API_KEY) {
    console.error('ROAMIFY_API_KEY not set');
    return;
  }

  console.log('🔍 Debugging Roamify API Response Structure...');
  console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');
  
  try {
    // Test the packages endpoint to see the actual response structure
    console.log('\n=== Testing /api/esim/packages endpoint ===');
    
    const response = await axios.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Headers:', Object.keys(response.headers));
    
    const data = response.data as any;
    console.log('\n📋 Response Structure:');
    console.log('Response type:', typeof data);
    console.log('Top-level keys:', Object.keys(data || {}));
    
    if (data && data.status) {
      console.log('Status:', data.status);
    }
    
    if (data && data.data) {
      console.log('\n📦 Data object keys:', Object.keys(data.data));
      
      if (data.data.countries && Array.isArray(data.data.countries)) {
        console.log(`\n🌍 Found ${data.data.countries.length} countries`);
        
        // Inspect first country
        if (data.data.countries.length > 0) {
          const firstCountry = data.data.countries[0];
          console.log('\n🏳️ First Country Structure:');
          console.log('Country keys:', Object.keys(firstCountry));
          console.log('Country name:', firstCountry.countryName || firstCountry.country || 'Unknown');
          console.log('Country code:', firstCountry.countryCode || 'Unknown');
          
          if (firstCountry.packages && Array.isArray(firstCountry.packages)) {
            console.log(`\n📱 Found ${firstCountry.packages.length} packages in first country`);
            
            // Inspect first package
            if (firstCountry.packages.length > 0) {
              const firstPackage = firstCountry.packages[0];
              console.log('\n📦 First Package Structure:');
              console.log('Package keys:', Object.keys(firstPackage));
              console.log('Full package object:', JSON.stringify(firstPackage, null, 2));
              
              // Check for common field names
              const commonFields = [
                'id', 'packageId', 'package', 'name', 'title',
                'country', 'countryName', 'country_code', 'countryCode',
                'region', 'area',
                'description', 'desc', 'details',
                'price', 'cost', 'amount',
                'data', 'dataAmount', 'data_amount', 'dataSize',
                'duration', 'days', 'day', 'validity', 'validity_days',
                'features', 'benefits',
                'operator', 'carrier',
                'isUnlimited', 'unlimited'
              ];
              
              console.log('\n🔍 Checking for common field names:');
              for (const field of commonFields) {
                if (firstPackage[field] !== undefined) {
                  console.log(`✅ ${field}:`, firstPackage[field]);
                }
              }
            }
          }
        }
      }
    }
    
    // Also test the /api/packages endpoint (different from /api/esim/packages)
    console.log('\n\n=== Testing /api/packages endpoint ===');
    
    try {
      const response2 = await axios.get(`${ROAMIFY_API_BASE}/api/packages`, {
        headers: {
          Authorization: `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: {
          page: 1,
          limit: 5
        },
        timeout: 30000
      });

      console.log('✅ /api/packages Response Status:', response2.status);
      
      const data2 = response2.data as any;
      console.log('\n📋 /api/packages Response Structure:');
      console.log('Response type:', typeof data2);
      console.log('Top-level keys:', Object.keys(data2 || {}));
      
      if (data2 && data2.data && Array.isArray(data2.data)) {
        console.log(`\n📦 Found ${data2.data.length} packages in /api/packages`);
        
        if (data2.data.length > 0) {
          const firstPackage = data2.data[0];
          console.log('\n📦 First Package from /api/packages:');
          console.log('Package keys:', Object.keys(firstPackage));
          console.log('Full package object:', JSON.stringify(firstPackage, null, 2));
        }
      }
    } catch (error: any) {
      console.error('❌ /api/packages endpoint failed:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Failed to fetch from Roamify:', ROAMIFY_API_BASE, error);
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugRoamifyResponse().catch(console.error); 