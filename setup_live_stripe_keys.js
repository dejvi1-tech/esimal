const fs = require('fs');
const path = require('path');

console.log('🔧 Live Stripe Keys Setup Guide\n');

console.log('📋 To get your live Stripe keys:');
console.log('1. Go to https://dashboard.stripe.com');
console.log('2. Make sure you\'re in LIVE MODE (toggle in top right)');
console.log('3. Go to Developers → API keys');
console.log('4. Copy the following keys:\n');

console.log('🔑 REQUIRED KEYS:');
console.log('   • Secret key (starts with sk_live_...)');
console.log('   • Publishable key (starts with pk_live_...)\n');

console.log('⚠️  IMPORTANT:');
console.log('   • You currently have a RESTRICTED key (rk_live_...)');
console.log('   • You need a SECRET key (sk_live_...) for payment processing');
console.log('   • Restricted keys cannot create payment intents\n');

console.log('📝 ENVIRONMENT FILES TO UPDATE:\n');

console.log('Backend (.env):');
console.log('STRIPE_SECRET_KEY=sk_live_your_actual_live_secret_key_here');
console.log('STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here\n');

console.log('Frontend (.env.local):');
console.log('VITE_API_URL=http://localhost:3001');
console.log('VITE_STRIPE_PUBLIC_KEY=pk_live_your_actual_live_public_key_here\n');

console.log('🌐 WEBHOOK SETUP:');
console.log('1. In Stripe Dashboard (Live Mode) → Developers → Webhooks');
console.log('2. Add endpoint: https://your-domain.com/api/webhooks/stripe');
console.log('3. Select events: payment_intent.succeeded, payment_intent.payment_failed');
console.log('4. Copy the webhook secret to your backend .env file\n');

console.log('🧪 TESTING:');
console.log('After updating the keys, run:');
console.log('node test_live_stripe_integration.js\n');

console.log('💡 TIPS:');
console.log('• Test with small amounts (50 cents)');
console.log('• Refund test payments immediately');
console.log('• Monitor your Stripe Dashboard for charges');
console.log('• Keep your secret keys secure and never commit them to git\n');

// Check current environment files
console.log('🔍 CURRENT ENVIRONMENT STATUS:\n');

// Check backend .env
const backendEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  const hasStripeKey = backendEnv.includes('STRIPE_SECRET_KEY=');
  const hasWebhookSecret = backendEnv.includes('STRIPE_WEBHOOK_SECRET=');
  
  console.log('Backend (.env):');
  console.log(`   Stripe Secret Key: ${hasStripeKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Webhook Secret: ${hasWebhookSecret ? '✅ Found' : '❌ Missing'}`);
  
  if (hasStripeKey) {
    const match = backendEnv.match(/STRIPE_SECRET_KEY=(.+)/);
    if (match) {
      const key = match[1].trim();
      if (key.startsWith('rk_live_')) {
        console.log('   ⚠️  WARNING: Using RESTRICTED key (rk_live_). Need SECRET key (sk_live_)');
      } else if (key.startsWith('sk_live_')) {
        console.log('   ✅ Using SECRET key (sk_live_) - Correct!');
      } else if (key.startsWith('sk_test_')) {
        console.log('   ⚠️  Using TEST key (sk_test_). Need LIVE key (sk_live_)');
      } else {
        console.log('   ❓ Unknown key format');
      }
    }
  }
} else {
  console.log('Backend (.env): ❌ File not found');
}

// Check frontend .env.local
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  const hasApiUrl = frontendEnv.includes('VITE_API_URL=');
  const hasStripePublicKey = frontendEnv.includes('VITE_STRIPE_PUBLIC_KEY=');
  
  console.log('Frontend (.env.local):');
  console.log(`   API URL: ${hasApiUrl ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Stripe Public Key: ${hasStripePublicKey ? '✅ Found' : '❌ Missing'}`);
  
  if (hasStripePublicKey) {
    const match = frontendEnv.match(/VITE_STRIPE_PUBLIC_KEY=(.+)/);
    if (match) {
      const key = match[1].trim();
      if (key.startsWith('pk_live_')) {
        console.log('   ✅ Using LIVE public key (pk_live_) - Correct!');
      } else if (key.startsWith('pk_test_')) {
        console.log('   ⚠️  Using TEST public key (pk_test_). Need LIVE key (pk_live_)');
      } else {
        console.log('   ❓ Unknown key format');
      }
    }
  }
} else {
  console.log('Frontend (.env.local): ❌ File not found');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Get your live Stripe keys from the dashboard');
console.log('2. Update both environment files with the correct keys');
console.log('3. Run: node test_live_stripe_integration.js');
console.log('4. Test the checkout flow with real money');
console.log('5. Refund test payments immediately\n'); 