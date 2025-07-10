# Stripe Webhook Signature Verification Fix Guide

## 🚨 Problem
Stripe webhook signature verification is failing with the error:
```
Webhook Signature Verification Failed
```

## ✅ Root Cause
The most common cause is that the raw request body is not being passed correctly to `stripe.webhooks.constructEvent()`. Stripe needs the raw Buffer of the body, not a parsed JSON object.

## 🔧 Fixes Applied

### 1. Fixed Webhook Controller (`backend/src/controllers/webhookController.ts`)

**Changes Made:**
- Added proper Buffer handling for `req.body`
- Added comprehensive error logging
- Added signature header validation
- Ensured raw body is passed to Stripe verification

```typescript
// Ensure req.body is a Buffer for Stripe verification
const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '', 'utf8');

// Added validation for signature header
if (!sig) {
  logger.error('No stripe-signature header found');
  return res.status(400).json({ error: 'No signature provided' });
}
```

### 2. Fixed Rate Limiting (`backend/src/index.ts`)

**Problem:** Rate limiter was interfering with webhook processing
**Solution:** Excluded webhook route from rate limiting

```typescript
// Apply rate limiting to API routes but exclude webhook
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for webhook route
  if (req.path === '/webhooks/stripe') {
    return next();
  }
  return limiter(req, res, next);
});
```

### 3. Verified Middleware Order

**Correct Order:**
1. ✅ Webhook route with `express.raw()` (FIRST)
2. ✅ Other middleware (`express.json()`, etc.)
3. ✅ Rate limiting (excluding webhook)

## 🧪 Testing

### Run the Test Script
```bash
cd backend
node test_webhook_setup.js
```

### Manual Testing
1. Start your server: `npm run dev`
2. Send a test webhook from Stripe Dashboard
3. Check server logs for webhook processing

## 🔍 Debugging Steps

### 1. Check Environment Variables
```bash
# Verify these are set correctly
echo $STRIPE_WEBHOOK_SECRET
echo $STRIPE_SECRET_KEY
```

### 2. Check Webhook URL in Stripe Dashboard
- Go to Stripe Dashboard → Developers → Webhooks
- Verify endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Check webhook secret matches your environment variable

### 3. Monitor Server Logs
```bash
# Watch for webhook events
npm run dev
```

Look for these log messages:
- `[EMAIL DEBUG] handleStripeWebhook called. Event type:`
- `[EMAIL DEBUG] req.body is Buffer: true`
- `[EMAIL DEBUG] Webhook signature verification successful`

### 4. Test with Stripe CLI (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## 🚀 Production Deployment

### 1. Environment Variables
Ensure these are set in production:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Webhook Endpoint
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `checkout.session.completed`, etc.

### 3. SSL/HTTPS
- Webhook endpoint must be HTTPS in production
- Stripe will not send webhooks to HTTP endpoints

## 📋 Verification Checklist

- [ ] Webhook route uses `express.raw({ type: 'application/json' })`
- [ ] Webhook route is defined BEFORE other middleware
- [ ] Rate limiting excludes webhook route
- [ ] `STRIPE_WEBHOOK_SECRET` environment variable is set
- [ ] Webhook URL in Stripe Dashboard is correct
- [ ] Server logs show successful signature verification
- [ ] Webhook events are being processed

## 🐛 Common Issues

### Issue: "No signature provided"
**Solution:** Check that Stripe is sending the `stripe-signature` header

### Issue: "Invalid signature"
**Solution:** 
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure webhook URL is correct
3. Check that raw body is not being modified by middleware

### Issue: "Webhook secret not configured"
**Solution:** Set the `STRIPE_WEBHOOK_SECRET` environment variable

## 📞 Support

If issues persist:
1. Check server logs for detailed error messages
2. Verify webhook configuration in Stripe Dashboard
3. Test with Stripe CLI for local development
4. Ensure all environment variables are correctly set

## 🔄 Next Steps

After fixing the webhook signature verification:

1. **Test Payment Flow:** Complete a test payment to verify webhook processing
2. **Monitor Logs:** Watch for successful webhook events
3. **Email Delivery:** Verify that confirmation emails are sent
4. **eSIM Generation:** Ensure eSIM codes are generated and delivered

---

**Last Updated:** $(date)
**Status:** ✅ Fixed 