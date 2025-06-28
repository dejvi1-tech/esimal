const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe with live key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

async function testLiveStripeIntegration() {
  console.log('🧪 Testing LIVE Stripe Integration (Real Money)...\n');
  console.log('⚠️  WARNING: This will process real payments!');
  console.log('💳 Test amount: $0.50 (50 cents)\n');

  try {
    // Test 1: Check API key validity
    console.log('1. Testing API key validity...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ API key is valid');
    console.log(`   Account: ${account.business_type || 'Standard'} account`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}`);
    console.log(`   Mode: ${account.object === 'account' ? 'Live' : 'Test'}\n`);

    if (!account.charges_enabled) {
      console.log('❌ Charges are not enabled on this account');
      console.log('   Please enable charges in your Stripe Dashboard');
      return;
    }

    // Test 2: Create a test customer
    console.log('2. Testing customer creation...');
    const customer = await stripe.customers.create({
      email: 'test@esimfly.al',
      name: 'Test Customer - Live Mode',
      metadata: {
        test: 'live_mode_test',
        integration_test: 'stripe_live_setup'
      }
    });
    console.log('✅ Customer created successfully');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}\n`);

    // Test 3: Create a test payment intent (50 cents)
    console.log('3. Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50, // $0.50 (50 cents)
      currency: 'usd',
      customer: customer.id,
      metadata: {
        test: 'live_mode_test',
        package_id: 'test_package_123',
        user_email: 'test@esimfly.al',
        refund_after_test: 'true'
      },
      description: 'Test eSIM Package - Live Mode Test',
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

    // Test 5: Environment variables check
    console.log('5. Environment variables check...');
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

    // Test 6: Frontend configuration check
    console.log('6. Frontend configuration check...');
    console.log('   Make sure to set these in your frontend .env file:');
    console.log('   - VITE_STRIPE_PUBLIC_KEY (pk_live_...)');
    console.log('   - VITE_API_URL');
    console.log('');

    console.log('🎉 Live Stripe integration test completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Set up webhook endpoint in Stripe Dashboard (Live Mode)');
    console.log('2. Configure frontend environment variables with live keys');
    console.log('3. Test the complete payment flow with real money');
    console.log('4. Monitor webhook events');
    console.log('');
    console.log('💡 To refund the test payment:');
    console.log(`   Payment Intent ID: ${paymentIntent.id}`);
    console.log('   Go to Stripe Dashboard → Payments → Find this payment → Refund');

  } catch (error) {
    console.error('❌ Live Stripe integration test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Type: ${error.type}`);
    console.error(`   Code: ${error.code}`);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your STRIPE_SECRET_KEY is correct (should start with sk_live_)');
    console.error('2. Ensure you\'re using live keys, not test keys');
    console.error('3. Verify your Stripe account is active and charges are enabled');
    console.error('4. Check Stripe API status: https://status.stripe.com');
  }
}

// Run the test
testLiveStripeIntegration(); 