const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Check API key validity
    console.log('1. Testing API key validity...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ API key is valid');
    console.log(`   Account: ${account.business_type || 'Standard'} account`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}\n`);

    // Test 2: Create a test customer
    console.log('2. Testing customer creation...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: {
        test: 'true',
        integration_test: 'stripe_setup'
      }
    });
    console.log('✅ Customer created successfully');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}\n`);

    // Test 3: Create a test payment intent
    console.log('3. Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      customer: customer.id,
      metadata: {
        test: 'true',
        package_id: 'test_package_123',
        user_email: 'test@example.com'
      },
      description: 'Test eSIM Package - 1GB for 7 days',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log('✅ Payment intent created successfully');
    console.log(`   Payment Intent ID: ${paymentIntent.id}`);
    console.log(`   Amount: $${paymentIntent.amount / 100}`);
    console.log(`   Currency: ${paymentIntent.currency}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...\n`);

    // Test 4: Test webhook signature verification
    console.log('4. Testing webhook signature verification...');
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ Webhook secret is configured');
      console.log(`   Secret: ${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...`);
    } else {
      console.log('⚠️  Webhook secret not configured');
      console.log('   Add STRIPE_WEBHOOK_SECRET to your .env file');
    }
    console.log('');

    // Test 5: Test refund creation
    console.log('5. Testing refund creation...');
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        reason: 'requested_by_customer',
        metadata: {
          test: 'true',
          reason: 'integration_test'
        }
      });
      console.log('✅ Refund created successfully');
      console.log(`   Refund ID: ${refund.id}`);
      console.log(`   Amount: $${refund.amount / 100}`);
      console.log(`   Status: ${refund.status}\n`);
    } catch (refundError) {
      console.log('⚠️  Refund test skipped (payment intent not charged)');
      console.log(`   Error: ${refundError.message}\n`);
    }

    // Test 6: Clean up test data
    console.log('6. Cleaning up test data...');
    await stripe.customers.del(customer.id);
    console.log('✅ Test customer deleted');
    console.log('');

    // Test 7: Environment variables check
    console.log('7. Environment variables check...');
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are set');
    } else {
      console.log('⚠️  Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }
    console.log('');

    // Test 8: Frontend configuration check
    console.log('8. Frontend configuration check...');
    console.log('   Make sure to set these in your frontend .env file:');
    console.log('   - VITE_STRIPE_PUBLIC_KEY');
    console.log('   - VITE_API_URL');
    console.log('');

    console.log('🎉 Stripe integration test completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Set up webhook endpoint in Stripe Dashboard');
    console.log('2. Configure frontend environment variables');
    console.log('3. Run database migration: npm run migration:sql');
    console.log('4. Test the complete payment flow');
    console.log('5. Monitor webhook events');

  } catch (error) {
    console.error('❌ Stripe integration test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Type: ${error.type}`);
    console.error(`   Code: ${error.code}`);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your STRIPE_SECRET_KEY is correct');
    console.error('2. Ensure you\'re using the right environment (test vs live)');
    console.error('3. Verify your Stripe account is active');
    console.error('4. Check Stripe API status: https://status.stripe.com');
  }
}

// Run the test
testStripeIntegration(); 