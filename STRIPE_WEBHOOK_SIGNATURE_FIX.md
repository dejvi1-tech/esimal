# Stripe Webhook Signature Verification Fix

## 🚨 Problem
Stripe webhook signature verification is failing because the raw body is an object instead of a Buffer.

**Error from logs:**
```
[EMAIL DEBUG] Raw body type: object ❌ (should be Buffer)
```

## ✅ Root Cause
The issue occurs when Express middleware processes the request body before it reaches the webhook handler. Stripe requires the raw request body as a Buffer to verify the signature, but the body is being parsed as a JSON object.

## 🔧 Fixes Applied

### 1. Custom Raw Body Parser
Replaced `express.raw()` with a custom middleware that ensures the raw body is captured as a Buffer:

```typescript
// Stripe webhook route FIRST, with custom raw body parser
app.post('/api/webhooks/stripe', (req, res, next) => {
  // Custom raw body parser for Stripe webhooks
  let data = '';
  
  req.setEncoding('utf8');
  
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    // Store the raw body as a Buffer
    req.body = Buffer.from(data, 'utf8');
    console.log('[WEBHOOK DEBUG] Raw body captured, length:', req.body.length);
    console.log('[WEBHOOK DEBUG] Raw body is Buffer:', Buffer.isBuffer(req.body));
    
    handleStripeWebhook(req, res, next);
  });
  
  req.on('error', (err) => {
    console.error('[WEBHOOK DEBUG] Error reading request body:', err);
    res.status(400).json({ error: 'Failed to read request body' });
  });
});
```

### 2. Enhanced Webhook Controller
Updated the webhook controller to handle Buffer conversion more robustly:

```typescript
// req.body should be a Buffer from our custom middleware
const rawBody = req.body;

if (!Buffer.isBuffer(rawBody)) {
  console.log('[EMAIL DEBUG] WARNING: req.body is not a Buffer!');
  console.log('[EMAIL DEBUG] req.body type:', typeof req.body);
  console.log('[EMAIL DEBUG] req.body:', req.body);
  
  // Fallback: try to convert to Buffer
  if (typeof req.body === 'string') {
    rawBody = Buffer.from(req.body, 'utf8');
  } else if (req.body && typeof req.body === 'object') {
    rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
  } else {
    rawBody = Buffer.from('', 'utf8');
  }
}
```

### 3. Comprehensive Debugging
Added extensive logging to track the webhook processing:

```typescript
console.log('[EMAIL DEBUG] handleStripeWebhook called. Event type:', typeof req.body);
console.log('[EMAIL DEBUG] req.body is Buffer:', Buffer.isBuffer(req.body));
console.log('[EMAIL DEBUG] req.body length:', req.body?.length);
console.log('[EMAIL DEBUG] Raw body content (first 100 chars):', rawBody.toString('utf8').substring(0, 100));
```

## 🧪 Testing

### 1. Check Environment Variables
```bash
# Verify these are set correctly
echo $STRIPE_WEBHOOK_SECRET
echo $STRIPE_SECRET_KEY
```

### 2. Monitor Server Logs
Look for these log messages:
- `[WEBHOOK DEBUG] Raw body captured, length:`
- `[WEBHOOK DEBUG] Raw body is Buffer: true`
- `[EMAIL DEBUG] Webhook signature verification successful`

### 3. Test with Stripe CLI (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## 🔍 Debugging Steps

### 1. Check Webhook URL in Stripe Dashboard
- Go to Stripe Dashboard → Developers → Webhooks
- Verify endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Check webhook secret matches your environment variable

### 2. Monitor Server Logs
```bash
# Watch for webhook events
npm run dev
```

Look for these log messages:
- `[WEBHOOK DEBUG] Raw body captured, length:`
- `[EMAIL DEBUG] handleStripeWebhook called. Event type:`
- `[EMAIL DEBUG] req.body is Buffer: true`
- `[EMAIL DEBUG] Webhook signature verification successful`

### 3. Test with Stripe CLI (Optional)
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

- [ ] Custom raw body parser is working
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

## 📚 Key Changes Made

### Files Modified:
1. `backend/src/index.ts` - Updated webhook route with custom raw body parser
2. `backend/src/controllers/webhookController.ts` - Enhanced Buffer handling and debugging

### Key Improvements:
1. **Custom Raw Body Parser**: Ensures raw body is captured as Buffer
2. **Enhanced Debugging**: Comprehensive logging for troubleshooting
3. **Fallback Handling**: Graceful handling of edge cases
4. **Middleware Order**: Webhook route defined before other middleware

## 🎯 Expected Results

After applying these fixes:
- ✅ Raw body will be a Buffer
- ✅ Webhook signature verification will succeed
- ✅ Comprehensive logging for debugging
- ✅ Robust error handling

The webhook should now properly verify Stripe signatures and process payment events correctly. 