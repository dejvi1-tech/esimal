# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for your eSIM marketplace application.

## 🚀 Overview

The Stripe integration includes:
- Payment Intent creation and processing
- Customer management
- Webhook handling for payment events
- Refund processing
- Email notifications for payment events
- Comprehensive error handling

## 📋 Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Node.js**: Version 16 or higher
3. **Database**: PostgreSQL with Supabase (already configured)

## 🔧 Environment Variables

Add the following environment variables to your `.env` file:

### Backend Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend Environment Variables (in frontend/.env)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_test_public_key_here
VITE_API_URL=http://localhost:3000
```

### Production Environment Variables

```bash
# Stripe Configuration (Production)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here

# Frontend Environment Variables (Production)
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_public_key_here
VITE_API_URL=https://your-domain.com
```

## 🔑 Getting Your Stripe Keys

### 1. Access Stripe Dashboard
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**

### 2. Get Test Keys (Development)
- **Publishable key**: Starts with `pk_test_`
- **Secret key**: Starts with `sk_test_`

### 3. Get Live Keys (Production)
- **Publishable key**: Starts with `pk_live_`
- **Secret key**: Starts with `sk_live_`

⚠️ **Important**: Never commit your secret keys to version control!

## 🌐 Webhook Configuration

### 1. Create Webhook Endpoint
1. Go to **Developers** → **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `customer.subscription.created` (optional)
   - `customer.subscription.updated` (optional)
   - `customer.subscription.deleted` (optional)

### 2. Get Webhook Secret
1. After creating the webhook, click on it
2. Go to **Signing secret**
3. Click **Reveal** to get the webhook secret
4. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 🗄️ Database Setup

### 1. Run Migration
The Stripe integration requires additional database fields. Run the migration:

```bash
# Navigate to backend directory
cd backend

# Run the migration
npm run migration:sql
```

### 2. Verify Database Schema
The migration will add the following fields to the `orders` table:
- `stripe_payment_intent_id` - Stripe payment intent ID
- `stripe_customer_id` - Stripe customer ID
- `stripe_refund_id` - Stripe refund ID
- `paid_at` - Payment timestamp
- `failed_at` - Failure timestamp
- `cancelled_at` - Cancellation timestamp
- `refunded_at` - Refund timestamp
- `failure_reason` - Payment failure reason

## 🚀 Testing the Integration

### 1. Test Cards
Use these test card numbers for testing:

| Card Type | Number | CVC | Expiry |
|-----------|--------|-----|--------|
| Visa | 4242424242424242 | Any 3 digits | Any future date |
| Mastercard | 5555555555554444 | Any 3 digits | Any future date |
| Declined | 4000000000000002 | Any 3 digits | Any future date |

### 2. Test the Payment Flow
1. Start your backend server: `npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to a package and click "Buy Now"
4. Fill in the checkout form with test card details
5. Complete the payment

### 3. Monitor Webhooks
Check your server logs for webhook events:
```bash
# Backend logs
npm run dev

# Check webhook events in Stripe Dashboard
# Developers → Webhooks → Your endpoint → Events
```

## 📧 Email Templates

The integration includes email templates for:
- Payment success
- Payment failure
- Payment cancellation
- Refund processed

These templates are automatically sent when webhook events are received.

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate keys regularly

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS in production
- Monitor webhook failures

### 3. PCI Compliance
- Stripe handles PCI compliance for you
- Never store raw card data
- Use Stripe Elements for card input

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid API key" Error
- Check that your `STRIPE_SECRET_KEY` is correct
- Ensure you're using the right key for your environment (test vs live)

#### 2. Webhook Signature Verification Failed
- Verify your `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook endpoint URL is accessible
- Check that raw body parsing is enabled for webhook route

#### 3. Payment Intent Creation Fails
- Check package exists in database
- Verify all required fields are provided
- Check Stripe account status and limits

#### 4. Frontend Payment Fails
- Verify `VITE_STRIPE_PUBLIC_KEY` is correct
- Check browser console for JavaScript errors
- Ensure Stripe Elements are properly loaded

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Stripe CLI (Optional)

Install Stripe CLI for local webhook testing:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📚 API Endpoints

### Payment Endpoints
- `POST /api/stripe/payment-intent` - Create payment intent
- `POST /api/stripe/confirm-payment` - Confirm payment
- `GET /api/stripe/payment-intent/:id` - Get payment status

### Customer Endpoints
- `GET /api/stripe/customer/:id` - Get customer details
- `GET /api/stripe/customer/:id/payment-methods` - Get customer payment methods
- `POST /api/stripe/payment-method/attach` - Attach payment method
- `DELETE /api/stripe/payment-method/:id` - Detach payment method

### Refund Endpoints
- `POST /api/stripe/refund` - Create refund

### Webhook Endpoint
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🚀 Going Live

### 1. Switch to Live Keys
1. Update environment variables with live keys
2. Update webhook endpoint URL to production domain
3. Test with small amounts first

### 2. Monitor Transactions
- Use Stripe Dashboard to monitor transactions
- Set up alerts for failed payments
- Monitor webhook delivery

### 3. Compliance
- Ensure your business complies with local regulations
- Set up proper terms of service and privacy policy
- Consider adding fraud detection

## 📞 Support

- **Stripe Documentation**: [docs.stripe.com](https://docs.stripe.com)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor webhook delivery rates
- Review failed payments
- Update Stripe SDK versions
- Monitor Stripe API changes

### Version Updates
```bash
# Update Stripe SDK
npm update stripe

# Check for breaking changes
# https://github.com/stripe/stripe-node/releases
```

---

🎉 **Congratulations!** Your Stripe integration is now complete and ready to process payments securely. 