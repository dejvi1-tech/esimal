const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/all-roamify-packages', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Response status:', data.status);
      console.log('Total packages:', data.count);
      
      if (data.data && data.data.length > 0) {
        console.log('\n=== SAMPLE MAPPED PACKAGE ===');
        const sample = data.data[0];
        console.log('ID:', sample.id);
        console.log('Country:', sample.country);
        console.log('Region:', sample.region);
        console.log('Description:', sample.description);
        console.log('Data:', sample.data);
        console.log('Validity:', sample.validity);
        console.log('Price:', sample.price);
        
        // Check if all required fields are present
        const requiredFields = ['id', 'country', 'region', 'description', 'data', 'validity', 'price'];
        const missingFields = requiredFields.filter(field => !sample[field] || sample[field] === 'unknown');
        
        if (missingFields.length > 0) {
          console.log('\n❌ MISSING REQUIRED FIELDS:', missingFields);
        } else {
          console.log('\n✅ All required fields are present and mapped correctly!');
        }
      }
    } else {
      console.error('Failed to fetch packages:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 