#!/bin/bash

# eSIM Delivery System - Apply Fixes Script
# This script applies the guest user fixes and runs validation tests

echo "🚀 Applying eSIM Delivery System Fixes..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Step 1: Apply the migration
echo ""
echo "1️⃣ Applying database migration..."
echo "   Please apply the migration in one of these ways:"
echo ""
echo "   Option A - Via Supabase Dashboard:"
echo "   1. Go to https://supabase.com/dashboard/projects"
echo "   2. Select your project"
echo "   3. Go to SQL Editor"
echo "   4. Run the contents of: supabase/migrations/20250104000000_final_guest_user_schema_fix.sql"
echo ""
echo "   Option B - Via Supabase CLI (if installed):"
echo "   supabase db push"
echo ""

# Wait for user confirmation
read -p "   Have you applied the migration? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please apply the migration first, then run this script again"
    exit 1
fi

# Step 2: Install dependencies if needed
echo ""
echo "2️⃣ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

# Step 3: Run the test
echo ""
echo "3️⃣ Running validation test..."
cd backend
if [ ! -f ".env" ]; then
    echo "❌ Please create a .env file in the backend directory with:"
    echo "   SUPABASE_URL=your_supabase_url"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi

# Run the test
echo "   Running test script..."
node test_guest_user_fix.js

# Check test result
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! All fixes have been applied and tested successfully!"
    echo "=========================================="
    echo "✅ Guest user creation is now working"
    echo "✅ User_orders table is properly configured"
    echo "✅ Webhook processing should work without errors"
    echo ""
    echo "Next steps:"
    echo "1. Monitor your webhook logs for reduced errors"
    echo "2. Test with a real order to verify the fix"
    echo "3. Consider running a package audit (see ESIM_DELIVERY_FIXES_SUMMARY.md)"
else
    echo ""
    echo "❌ Test failed. Please check the output above and:"
    echo "1. Verify the migration was applied correctly"
    echo "2. Check your .env file has the correct credentials"
    echo "3. Ensure your Supabase service role has proper permissions"
fi 