# Webhook Slug Fix - eSIM Delivery Issue (Greece Format Standard)

## Problem Description

The webhook system is failing to deliver eSIMs with the following error:

```
Error: No Roamify slug found for package: f6315d94-55d7-4402-9637-968cb54cb74c. 
Package may not be properly configured for eSIM delivery.
```

## Root Cause

The issue occurs because:
1. The `my_packages` table has packages without proper `slug` values
2. The webhook delivery system requires a `slug` field to create Roamify orders
3. When a package is missing a slug, the webhook fails and customers don't receive their eSIM
4. **Countries are inconsistent**: Greece uses the correct format (`esim-greece-30days-1gb-all`) but other countries use incorrect country codes (`esim-gr-30days-1gb-all`)

## Greece Format Standard (CORRECT)

Greece is working correctly and ALL countries should follow this pattern:

### ✅ Correct Format (Greece Style)
- **Greece**: `esim-greece-30days-1gb-all`
- **Albania**: `esim-albania-30days-3gb-all`
- **Germany**: `esim-germany-15days-5gb-all`
- **United States**: `esim-united-states-30days-20gb-all`
- **United Kingdom**: `esim-united-kingdom-30days-15gb-all`

### ❌ Incorrect Format (Country Code Style)
- ~~`esim-gr-30days-1gb-all`~~ (Should be `esim-greece-30days-1gb-all`)
- ~~`esim-al-30days-3gb-all`~~ (Should be `esim-albania-30days-3gb-all`)
- ~~`esim-de-15days-5gb-all`~~ (Should be `esim-germany-15days-5gb-all`)

## Fix Options

### Option 1: Comprehensive SQL Fix (Recommended)
Run the comprehensive SQL script to convert ALL countries to Greece format:

```sql
-- Run this in your Supabase SQL editor
\i backend/fix_all_countries_greece_format.sql
```

This will:
- Fix the specific failing package
- Convert all country code formats to full country names
- Make all packages consistent with Greece format
- Handle future countries automatically

### Option 2: Quick Fix (Original)
If you just want to fix missing slugs without converting formats:

```sql
\i backend/urgent_slug_fix.sql
```

### Option 3: Node.js Scripts
For specific package or all missing slugs:

```bash
cd backend
node fix_specific_package_slug.js        # Fix just the failing package
node fix_all_missing_slugs.js           # Fix all packages with missing slugs
```

## Environment Variables Needed

For Node.js scripts, you need:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Slug Format Standard

The system now generates slugs in Greece format:
```
esim-{full-country-name}-{days}days-{data_amount}gb-all
```

### Country Name Mapping
- **Greece** → `greece`
- **Albania** → `albania`
- **Germany** → `germany`
- **United States** → `united-states`
- **United Kingdom** → `united-kingdom`
- **France** → `france`
- **Italy** → `italy`
- **Spain** → `spain`
- **Any Country Name** → Automatically converted to lowercase with spaces → hyphens

### Examples by Country
```
Greece:         esim-greece-30days-1gb-all
Albania:        esim-albania-30days-3gb-all
Germany:        esim-germany-15days-5gb-all
United States:  esim-united-states-30days-20gb-all
United Kingdom: esim-united-kingdom-30days-15gb-all
France:         esim-france-7days-2gb-all
Italy:          esim-italy-30days-5gb-all
Spain:          esim-spain-15days-3gb-all
```

## Verification

After running the comprehensive fix, verify it worked:

1. **Specific failing package:**
   ```sql
   SELECT id, name, slug, country_name 
   FROM my_packages 
   WHERE id = 'f6315d94-55d7-4402-9637-968cb54cb74c';
   ```

2. **All packages have Greece-style slugs:**
   ```sql
   SELECT 
     country_name,
     MIN(slug) as sample_slug,
     COUNT(*) as package_count
   FROM my_packages 
   WHERE slug IS NOT NULL 
   GROUP BY country_name 
   ORDER BY country_name;
   ```

3. **No packages using country codes:**
   ```sql
   SELECT COUNT(*) as old_format_count
   FROM my_packages 
   WHERE slug LIKE 'esim-gr-%' 
      OR slug LIKE 'esim-al-%' 
      OR slug LIKE 'esim-de-%';
   ```

4. **Test webhook delivery:**
   - Try purchasing the package again
   - Check webhook logs for successful delivery

## Prevention for Future Packages

To ensure all new packages automatically use Greece format:

1. **Update package sync scripts** to use the new `generate_greece_style_slug()` function
2. **Add database constraints** to prevent country code formats
3. **Set up monitoring** for non-conforming slugs
4. **Include validation** in package creation process

## Files Created

- `backend/fix_all_countries_greece_format.sql` - **Comprehensive Greece format fix**
- `backend/fix_specific_package_slug.js` - Fix the specific failing package
- `backend/fix_all_missing_slugs.js` - Fix all packages with missing slugs
- `backend/urgent_slug_fix.sql` - SQL script for immediate fix (basic)
- `backend/WEBHOOK_SLUG_FIX_README.md` - This documentation

## Migration Summary

**BEFORE** (Inconsistent):
- Greece: `esim-greece-30days-1gb-all` ✅
- Albania: `esim-al-30days-3gb-all` ❌
- Germany: `esim-de-15days-5gb-all` ❌

**AFTER** (Consistent Greece Format):
- Greece: `esim-greece-30days-1gb-all` ✅
- Albania: `esim-albania-30days-3gb-all` ✅
- Germany: `esim-germany-15days-5gb-all` ✅

## Support

If the fix doesn't work:
1. Check that all packages follow Greece format (full country names)
2. Verify the Roamify API accepts the new slug formats
3. Ensure the generated slugs match your existing working Greece packages
4. Check database permissions for the service role key
5. Test with a known working Greece package first 