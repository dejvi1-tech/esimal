const axios = require('axios');

// Test webhook endpoint setup
async function testWebhookSetup() {
  console.log('Testing webhook endpoint setup...');
  
  try {
    // Test 1: Check if endpoint is accessible
    const response = await axios.post('http://localhost:3001/api/webhooks/stripe', {
      test: 'data'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      }
    });
    
    console.log('✅ Webhook endpoint is accessible');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Webhook endpoint test failed');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data);
    
    if (error.response?.status === 400) {
      console.log('✅ Expected 400 error for invalid signature - webhook is working correctly');
    }
  }
}

// Test 2: Check if raw body parsing is working
async function testRawBodyParsing() {
  console.log('\nTesting raw body parsing...');
  
  try {
    const testData = JSON.stringify({ test: 'webhook_data' });
    const buffer = Buffer.from(testData, 'utf8');
    
    const response = await axios.post('http://localhost:3001/api/webhooks/stripe', buffer, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      }
    });
    
    console.log('✅ Raw body parsing test completed');
    
  } catch (error) {
    console.log('❌ Raw body parsing test failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testWebhookSetup();
  await testRawBodyParsing();
  console.log('\nWebhook setup test completed');
}

runTests().catch(console.error); 