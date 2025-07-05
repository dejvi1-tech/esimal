#!/bin/bash

echo "🔧 Running package ID fixes..."
echo "================================"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    echo "Please set these environment variables and try again"
    exit 1
fi

echo "✅ Environment variables are set"
echo ""

# Run the comprehensive fix for all UUID package IDs
echo "🔄 Running comprehensive fix for all UUID package IDs..."
node fix_all_uuid_package_ids.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Comprehensive fix completed successfully!"
else
    echo ""
    echo "❌ Comprehensive fix failed!"
    exit 1
fi

echo ""
echo "🎉 All package ID fixes completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test with a new order"
echo "2. Check logs to ensure no more fallbacks are needed"
echo "3. Monitor the system for any remaining issues" 