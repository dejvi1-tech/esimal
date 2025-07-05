# Webhook Delivery RLS Fix

## 🚨 Problem
The eSIM webhook delivery system was failing with Row Level Security (RLS) policy violations:

```
ERROR: new row violates row-level security policy for table "user_orders"
ERROR: new row violates row-level security policy for table "users"
```

Orders were proceeding to email delivery but failing to create `user_orders` entries for tracking.

## 🔧 Root Cause
1. **Missing Service Role Policies**: The webhook controller was using regular Supabase client instead of service role client
2. **Guest User RLS Issues**: No proper RLS policies for service role to manage guest users
3. **Inconsistent Client Usage**: Mixed usage of regular client vs service role client in webhook controller

## ✅ Solution Applied

### 1. Updated Webhook Controller (`backend/src/controllers/webhookController.ts`)
- ✅ Changed guest user operations to use `supabaseAdmin` (service role client)
- ✅ Changed `user_orders` creation to use `supabaseAdmin` to bypass RLS
- ✅ Maintained graceful error handling for backward compatibility

### 2. Comprehensive Database Migration (`supabase/migrations/20250105000002_comprehensive_webhook_delivery_fix.sql`)
- ✅ Ensures guest user `00000000-0000-0000-0000-000000000000` exists
- ✅ Creates comprehensive service role policies for `users` table
- ✅ Fixes `user_orders` table foreign key constraints
- ✅ Creates service role policies for `user_orders` table
- ✅ Sets up `processed_events` table for webhook idempotency
- ✅ Adds proper indexes for performance
- ✅ Includes verification steps

### 3. Test Suite (`backend/test_webhook_delivery_fix.js`)
- ✅ Verifies guest user exists and is accessible
- ✅ Tests service role can create `user_orders` entries
- ✅ Confirms regular client is properly denied (RLS working)
- ✅ Validates all supporting tables exist

## 🚀 How to Apply

### Step 1: Run the Migration
```bash
# In your Supabase dashboard or CLI
supabase migration run
```

Or run the SQL directly in Supabase SQL Editor:
```sql
-- Copy and paste the content from:
-- supabase/migrations/20250105000002_comprehensive_webhook_delivery_fix.sql
```

### Step 2: Deploy Updated Code
```bash
# Deploy the updated webhook controller
npm run build
npm run deploy
```

### Step 3: Test the Fix
```bash
# Run the test suite
cd backend
node test_webhook_delivery_fix.js
```

## 🧪 Testing

The test suite will verify:
- ✅ Guest user exists and is accessible
- ✅ Service role can create `user_orders` entries
- ✅ Regular client access is properly denied (RLS working)
- ✅ All supporting tables exist and are configured

Expected output:
```
🧪 Testing webhook delivery fix...

1️⃣ Testing guest user existence...
✅ Guest user exists:
   ID: 00000000-0000-0000-0000-000000000000
   Email: guest@esimal.com
   Role: user

2️⃣ Testing user_orders table configuration...
✅ user_orders table exists and accessible

3️⃣ Testing user_orders creation with service role...
✅ user_orders entry created successfully:
   Order ID: <uuid>
   User ID: 00000000-0000-0000-0000-000000000000
   Status: active

4️⃣ Testing regular client access (should fail)...
✅ Regular client correctly denied access (RLS working)

5️⃣ Testing processed_events table...
✅ processed_events table exists and accessible

==================================================
📊 TEST SUMMARY
==================================================
Tests passed: 5/5
🎉 All tests passed! Webhook delivery fix is working correctly.
```

## 🔍 What Changed

### Before (Failing)
```typescript
// Regular client - subject to RLS policies
const { data: userOrder, error: userOrderError } = await supabase
  .from('user_orders')
  .insert(userOrderData)
  .select()
  .single();
```

### After (Working)
```typescript
// Service role client - bypasses RLS policies
const { data: userOrder, error: userOrderError } = await supabaseAdmin
  .from('user_orders')
  .insert(userOrderData)
  .select()
  .single();
```

## 🎯 Impact

After applying this fix:
- ✅ Webhook delivery will complete successfully
- ✅ `user_orders` entries will be created for all orders
- ✅ Guest users can place orders without RLS violations
- ✅ Email delivery continues to work
- ✅ Admin can track all orders properly

## 🔧 Troubleshooting

### If tests fail:
1. **Check environment variables**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
2. **Run migration**: Make sure the SQL migration has been applied
3. **Check Supabase dashboard**: Verify service role policies exist in the Auth -> Policies section
4. **Verify table structure**: Ensure `user_orders` table exists and has proper columns

### If webhook still fails:
1. **Check logs**: Look for RLS policy violations in webhook logs
2. **Verify client usage**: Ensure webhook controller is using `supabaseAdmin` for sensitive operations
3. **Test manually**: Use the test suite to isolate the issue

## 🎉 Success Indicators

After successful deployment, webhook logs should show:
```
✅ Guest user exists: 00000000-0000-0000-0000-000000000000 (guest@esimal.com)
✅ User orders entry created successfully
```

Instead of:
```
❌ Error creating user_orders entry
⚠️ Order proceeding to email delivery despite user_orders creation failure
``` 