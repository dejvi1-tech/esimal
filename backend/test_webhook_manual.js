const axios = require('axios');

// Test webhook manually for the recent payment
async function testWebhook() {
  const paymentIntentId = 'pi_3Rf6OTDEHnCVTkPq0SrVFCRL';
  
  console.log('Testing webhook for payment intent:', paymentIntentId);
  
  try {
    // First, let's check if the order exists
    const orderResponse = await axios.get(`http://localhost:3001/api/admin/orders/debug/${paymentIntentId}`);
    console.log('Order found:', orderResponse.data);
    
    // Now let's manually trigger the webhook
    const webhookResponse = await axios.post('http://localhost:3001/api/webhooks/stripe', {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 249,
          currency: 'eur',
          customer: 'cus_SaGfUzehV26XaC',
          metadata: {
            email: 'dejvikacollja@gmail.com',
            packageId: 'esim-germany-30days-1gb-all',
            packageName: '1 GB - 30 Days',
            packageDataAmount: '1024',
            packageValidityDays: '30',
            name: 'Dejvi',
            surname: 'Kacollja',
            phone: '123456789',
            country: 'XK'
          },
          status: 'succeeded'
        }
      }
    }, {
      headers: {
        'stripe-signature': 'test_signature',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Webhook response:', webhookResponse.data);
    
  } catch (error) {
    console.error('Error testing webhook:', error.response?.data || error.message);
  }
}

testWebhook(); 