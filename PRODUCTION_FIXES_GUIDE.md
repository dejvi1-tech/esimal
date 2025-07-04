# Production Issues Fix Guide

## 📊 **Current Status Analysis**

Based on the logs from July 4, 2025, your eSIM system is **mostly working** but has two key issues:

### ✅ **What's Working**
- Payment processing (Stripe integration) ✅
- eSIM order creation with Roamify ✅
- Email delivery with QR codes ✅
- Fallback system for invalid package IDs ✅
- QR code generation and validation ✅

### ⚠️ **Issues to Fix**
1. **Guest User RLS Policy Violations** - Orders complete but user_orders entries fail
2. **Invalid Roamify Package IDs** - Causes unnecessary fallbacks

---

## 🔧 **Immediate Fixes Required**

### **1. Fix Guest User RLS Policies**

**Issue**: `new row violates row-level security policy for table "user_orders"`

**Solution**: Run the SQL migration in Supabase dashboard:

```sql
-- Copy and paste this into Supabase SQL Editor
-- File: supabase/migrations/20250105000000_fix_guest_user_rls_final.sql

-- Step 1: Ensure guest user exists
INSERT INTO users (id, email, password, role) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'guest@esimal.com',
  'disabled-account',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Fix service role policies
DROP POLICY IF EXISTS "Allow service role to manage guest users" ON users;
DROP POLICY IF EXISTS "Allow service role to insert guest users" ON users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;

CREATE POLICY "Service role full access to users table" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 3: Fix user_orders policies
DROP POLICY IF EXISTS "Allow service role full access to user_orders" ON user_orders;

CREATE POLICY "Service role full access to user_orders table" ON user_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 4: Grant explicit permissions
GRANT ALL ON users TO service_role;
GRANT ALL ON user_orders TO service_role;
```

### **2. Fix Invalid Roamify Package IDs**

**Issue**: Backend was auto-generating invalid package IDs like `esim-de-30days-1gb-all` instead of using real ones

**Root Cause**: The `savePackage` function was ignoring the real Roamify package ID and auto-generating fake ones

**Solution**: 
1. **Fixed the backend code** to use real Roamify package IDs from `reseller_id`
2. **Fix existing packages** with invalid IDs:

```bash
cd backend
node fix_existing_invalid_package_ids.js
```

**Code Fix Details:**
- Modified `backend/src/controllers/packageController.ts`
- Now uses `reseller_id` (real Roamify package ID) instead of auto-generating fake ones
- **Requires backend deployment** to take effect

---

## 📋 **Step-by-Step Fix Process**

### **Step 1: Run Comprehensive Check**
```bash
cd backend
node fix_production_issues.js
```

### **Step 2: Fix Database Policies**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `supabase/migrations/20250105000000_fix_guest_user_rls_final.sql`
3. Click "Run"

### **Step 3: Fix Package Mappings**
```bash
cd backend
node fix_existing_invalid_package_ids.js
```

### **Step 4: Deploy Updated Backend Code**
The backend code has been updated to use real Roamify package IDs. Deploy to Render:
1. Commit and push the changes to your repository
2. Render will automatically deploy the updated backend
3. Wait for deployment to complete

### **Step 5: Verify Fixes**
1. Place a test order
2. Check logs for:
   - ✅ No "user_orders creation failure" errors
   - ✅ No "Fallback package used" warnings
   - ✅ Successful email delivery

---

## 🎯 **Expected Results After Fixes**

### **Before Fix (Current State)**
```
⚠️ Order 834a0fed-... will continue without user_orders entry
⚠️ Fallback package used for order 834a0fed-...
❌ Failed to create guest user: row violates row-level security policy
```

### **After Fix (Target State)**
```
✅ Order created successfully with user_orders entry
✅ Using real Roamify package ID (no fallback needed)
✅ Guest user operations working correctly
✅ Package cd837948-dcab-487b-b080-4112e5c3d0e6 uses correct Roamify ID
✅ Customer gets exactly what they ordered (Germany 1GB, not Europe 3GB)
```

---

## 📊 **Monitoring & Alerts**

### **Key Log Messages to Watch**

#### ✅ **Success Indicators**
- `✅ user_orders entry created successfully`
- `✅ Using original package ID`
- `✅ Two-step email flow completed successfully`

#### ⚠️ **Warning Signs**
- `⚠️ Fallback package used for order`
- `⚠️ Order will continue without user_orders entry`
- `❌ Failed to create guest user`

### **Monitoring Commands**
```bash
# Watch for user_orders failures
grep "user_orders creation failure" logs/combined.log

# Monitor fallback usage
grep "Fallback package used" logs/combined.log

# Check email delivery success
grep "Email sent to" logs/combined.log
```

---

## 🔄 **Preventive Measures**

### **1. Package ID Validation**
- Implement automated sync with Roamify API
- Validate package IDs before deployment
- Set up alerts for invalid package IDs

### **2. RLS Policy Management**
- Document all RLS policies
- Test policies with service role
- Regular RLS policy audits

### **3. Monitoring Dashboard**
- Order completion rates
- Fallback usage statistics
- Email delivery success rates

---

## 🚨 **Troubleshooting**

### **If Guest User Fix Doesn't Work**
1. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verify service role permissions: `SELECT * FROM pg_policies WHERE tablename = 'users';`
3. Try disabling RLS temporarily: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`

### **If Package Fix Doesn't Work**
1. Check Roamify API connectivity
2. Verify API key permissions
3. Manual package ID validation

### **If Orders Still Fail**
1. Check Supabase service role key
2. Verify database connection
3. Review webhook endpoint configuration

---

## 📞 **Support**

If issues persist after running all fixes:

1. **Check Logs**: Review `logs/combined.log` for specific error messages
2. **Database Access**: Ensure Supabase service role has proper permissions
3. **API Keys**: Verify Roamify API key is valid and has necessary permissions
4. **Environment Variables**: Confirm all required environment variables are set

---

## 📈 **Success Metrics**

After implementing fixes, you should see:
- **0** user_orders creation failures
- **0** unnecessary fallback package usage
- **100%** email delivery success rate
- **Improved** order completion tracking

The system is already handling orders successfully - these fixes will eliminate the warning messages and improve data integrity. 