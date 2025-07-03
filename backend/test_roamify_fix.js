const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const roamifyApiKey = process.env.ROAMIFY_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !roamifyApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testRoamifyFix() {
  try {
    console.log('🧪 Testing fixed Roamify API call...');
    console.log('API Base URL:', ROAMIFY_API_BASE);
    console.log('API Key (first 10 chars):', roamifyApiKey.substring(0, 10) + '...');
    
    // Test the fixed endpoint
    console.log('\n🌐 Testing /api/esim/packages endpoint...');
    
    const response = await fetch(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${roamifyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Roamify API responded with status: ${response.status}`);
    }

    const json = await response.json();
    
    // Debug: Log the raw response structure
    console.log('\n=== RAW ROAMIFY API RESPONSE ===');
    console.log('Response type:', typeof json);
    console.log('Top-level keys:', Object.keys(json || {}));
    
    if (json.data && json.data.packages) {
      console.log(`Found ${json.data.packages.length} countries in response`);
      
      // Count total packages
      let totalPackages = 0;
      for (const country of json.data.packages) {
        if (country.packages && Array.isArray(country.packages)) {
          totalPackages += country.packages.length;
        }
      }
      console.log(`Total packages across all countries: ${totalPackages}`);
      
      // Show sample country structure
      if (json.data.packages.length > 0) {
        const sampleCountry = json.data.packages[0];
        console.log('\n📋 Sample country structure:');
        console.log('Country keys:', Object.keys(sampleCountry));
        console.log('Country name:', sampleCountry.countryName);
        console.log('Country code:', sampleCountry.countryCode);
        console.log('Packages count:', sampleCountry.packages?.length || 0);
        
        if (sampleCountry.packages && sampleCountry.packages.length > 0) {
          const samplePackage = sampleCountry.packages[0];
          console.log('\n📦 Sample package structure:');
          console.log('Package keys:', Object.keys(samplePackage));
          console.log('Package name:', samplePackage.package);
          console.log('Package price:', samplePackage.price);
          console.log('Package data:', samplePackage.dataAmount);
          console.log('Package validity_days:', samplePackage.validity_days);
        }
      }
    }
    
    console.log('=== END RAW RESPONSE ===');
    
    console.log('\n✅ Roamify API test successful!');
    console.log('The fixed endpoint is working correctly.');
    
  } catch (error) {
    console.error('❌ Roamify API test failed:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRoamifyFix(); 