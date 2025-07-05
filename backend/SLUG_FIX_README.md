# Slug Fix Solution for eSIM Delivery

This solution automatically detects and fixes missing slugs in the `my_packages` table to prevent eSIM delivery failures.

## Problem

When packages in the `my_packages` table are missing the `slug` field, the webhook controller fails with:
```
❌ No slug found for package: {packageId}. Package may not be properly configured for eSIM delivery.
```

This prevents eSIM delivery and causes order failures.

## Solution

The solution consists of several scripts that work together to:

1. **Auto-detect** packages with missing slugs
2. **Fetch correct slugs** from Roamify API
3. **Update packages** with proper slug values
4. **Test webhook functionality** to ensure it works
5. **Enforce slug updates** in sync processes

## Scripts

### 1. `auto_fix_missing_slugs.js`
**Purpose**: Core script to detect and fix missing slugs

**Features**:
- Scans `my_packages` table for packages with missing slugs
- Fetches correct slugs from Roamify API
- Matches packages by `features.packageId`, country, data amount, and days
- Generates fallback slugs for unmatched packages
- Updates database with correct slug values
- Provides detailed logging and error reporting

**Usage**:
```bash
node auto_fix_missing_slugs.js
```

### 2. `test_webhook_slug_fix.js`
**Purpose**: Test webhook slug extraction functionality

**Features**:
- Simulates webhook controller slug extraction logic
- Tests packages with valid and missing slugs
- Specifically tests Greece packages
- Provides comprehensive test results and coverage statistics

**Usage**:
```bash
node test_webhook_slug_fix.js
```

### 3. `complete_slug_fix_solution.js`
**Purpose**: Complete end-to-end solution

**Features**:
- Combines auto-fix and testing functionality
- Provides step-by-step execution
- Final verification and summary
- Clear success/failure reporting

**Usage**:
```bash
node complete_slug_fix_solution.js
```

## How It Works

### 1. Slug Detection
```javascript
// Scan for missing slugs
const missing = await db
  .from('my_packages')
  .select('id, features')
  .is('slug', null);
```

### 2. Slug Resolution
The script tries multiple strategies to find the correct slug:

1. **Roamify API Match**: Look for exact match by `features.packageId`
2. **Country/Data Match**: Match by country code, data amount, and days
3. **Fallback Generation**: Generate slug using pattern: `esim-{country}-{days}days-{data}gb-all`

### 3. Database Update
```javascript
// Update each package with correct slug
for (const pkg of missing) {
  await db
    .from('my_packages')
    .update({ slug: pkg.slug })
    .eq('id', pkg.id);
}
```

### 4. Webhook Testing
The script simulates the webhook controller logic:
```javascript
// Check for slug (this is what the webhook does)
if (!packageData.slug) {
  throw new Error(`No Roamify slug found for package: ${packageId}`);
}
const roamifyPackageId = packageData.slug;
```

## Expected Results

After running the fix, you should see:

### Before Fix
```
❌ No slug found for package: {packageId}
❌ This would cause webhook failure!
```

### After Fix
```
✅ Slug found: esim-greece-30days-1gb-all - webhook would succeed
📦 Would use slug for Roamify V2 API: esim-greece-30days-1gb-all
[ROAMIFY V2 DEBUG] Request Payload: { items: [ { packageId: "esim-greece-30days-1gb-all", quantity: 1 } ] }
```

## Slug Format

Slugs follow the pattern: `esim-{country}-{days}days-{data}gb-all`

Examples:
- `esim-greece-30days-1gb-all`
- `esim-germany-7days-3gb-all`
- `esim-albania-15days-5gb-all`

## Environment Variables

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `ROAMIFY_API_KEY`: Roamify API key for fetching package data
- `ROAMIFY_API_URL`: Roamify API URL (defaults to `https://api.getroamify.com`)

## Integration with Sync Process

The sync script `sync_my_packages_with_real_packages.js` has been updated to include slug generation:

```javascript
// Generate slug for Roamify V2 API
const slug = pkg.features?.packageId || 
             `esim-${(pkg.country_code || 'global').toLowerCase()}-${pkg.validity_days || 30}days-${Math.floor(pkg.data_amount || 1)}gb-all`;

return {
  // ... other fields
  slug: slug, // Add slug for Roamify V2 API
};
```

## Monitoring

After implementing the fix:

1. **Monitor logs** for "No slug found" errors
2. **Run the test script** periodically to verify coverage
3. **Check webhook success rates** for eSIM delivery
4. **Verify Roamify API responses** contain correct package IDs

## Troubleshooting

### Common Issues

1. **Roamify API Unavailable**
   - Script will use fallback slug generation
   - Check API key and network connectivity

2. **Package Mismatches**
   - Verify country codes match between your data and Roamify
   - Check data amounts and validity periods

3. **Database Permission Errors**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` has write permissions
   - Check RLS policies on `my_packages` table

### Debug Mode

Add debug logging by modifying the scripts:
```javascript
console.log('Debug: Package data:', pkg);
console.log('Debug: Roamify packages:', roamifyPackages);
```

## Success Metrics

- ✅ 100% slug coverage in `my_packages` table
- ✅ No "No slug found" errors in webhook logs
- ✅ Successful eSIM delivery for all packages
- ✅ Correct Roamify V2 API payload format

## Next Steps

1. **Run the complete solution**: `node complete_slug_fix_solution.js`
2. **Test with real webhook**: Trigger a test order for Greece package
3. **Monitor production**: Watch for any remaining slug-related errors
4. **Automate**: Consider running the fix script periodically or on package sync 