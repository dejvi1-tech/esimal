#!/bin/bash

echo "🚀 Starting Production Fixes for eSIM System"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo ""
echo "📋 Step 1: Running comprehensive diagnostics..."
cd backend
node fix_production_issues.js

echo ""
echo "📋 Step 2: Fixing existing invalid package IDs..."
node fix_existing_invalid_package_ids.js

echo ""
echo "📋 Step 3: Fixing Roamify package mappings (if needed)..."
node fix_roamify_package_mappings.js

echo ""
echo "📋 Step 4: Database migration instructions..."
echo "=============================================="
echo "⚠️  IMPORTANT: You need to run the database migration manually"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of:"
echo "   supabase/migrations/20250105000000_fix_guest_user_rls_final.sql"
echo "4. Click 'Run' to execute the migration"
echo ""
echo "📋 Step 5: Deploy updated backend code..."
echo "=============================================="
echo "The backend code has been updated to use real Roamify package IDs."
echo "You need to deploy the updated backend to Render."
echo ""
echo "📋 Step 6: Verification..."
echo "After running the database migration, test with a new order and check logs for:"
echo "✅ No 'user_orders creation failure' errors"
echo "✅ No 'Fallback package used' warnings"
echo "✅ Successful email delivery"
echo ""
echo "🎉 Production fixes completed!"
echo "📖 See PRODUCTION_FIXES_GUIDE.md for detailed instructions" 