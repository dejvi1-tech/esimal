# Package Integrity Verification System

This system ensures data integrity between the `packages` and `my_packages` tables in your Supabase database.

## Table Relationship

- **`packages` table**: Contains all available packages from the API (11,000+ entries)
  - Primary key: `id` (UUID)
  
- **`my_packages` table**: Contains only packages selected/imported via admin panel
  - Primary key: `id` (UUID) - *different from packages.id*
  - Foreign key: `reseller_id` (TEXT) - *references packages.id*

## Problem

The `reseller_id` field in `my_packages` should always reference a valid `id` in the `packages` table. However, due to various operations (deletions, imports, etc.), some records may become "orphaned" where `my_packages.reseller_id` points to non-existent `packages.id` values.

## Solution

This system provides three tools to verify and fix integrity issues:

1. **SQL Script** - Quick verification in Supabase SQL editor
2. **Node.js Verification Script** - Detailed analysis and reporting
3. **Node.js Fix Script** - Automated fixes for common issues

---

## 🔍 Quick Verification (SQL)

### Method 1: Supabase SQL Editor

1. Open your Supabase project → SQL Editor
2. Copy and paste the contents of `verify_package_integrity.sql`
3. Run the script to see comprehensive integrity report

### Method 2: Quick One-Line Check

```sql
SELECT 
  (SELECT COUNT(*) FROM packages) as packages_total,
  (SELECT COUNT(*) FROM my_packages) as my_packages_total,
  (SELECT COUNT(*) FROM my_packages WHERE reseller_id IS NOT NULL) as with_reseller_id,
  (SELECT COUNT(*) FROM my_packages mp INNER JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL) as valid_references,
  (SELECT COUNT(*) FROM my_packages mp LEFT JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL AND p.id IS NULL) as orphaned_records,
  CASE 
    WHEN (SELECT COUNT(*) FROM my_packages mp LEFT JOIN packages p ON p.id::text = mp.reseller_id WHERE mp.reseller_id IS NOT NULL AND p.id IS NULL) = 0 
    THEN '✅ ALL GOOD - No orphaned records' 
    ELSE '❌ ISSUES FOUND - Run full verification' 
  END as status;
```

---

## 🔍 Detailed Verification (Node.js)

### Prerequisites

1. Ensure you have the required environment variables in your `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

### Run Verification

```bash
cd backend
node verify_package_integrity.js
```

### Sample Output

```
🔍 Starting Package Integrity Verification...

📊 Table Statistics:
   - packages table: 11296 records
   - my_packages table: 45 records

📦 Analyzing 45 packages from my_packages table...

✅ VERIFICATION RESULTS:
   - Total my_packages records: 45
   - Records with reseller_id: 42
   - Records without reseller_id: 3
   - Valid references: 40
   - Orphaned records: 2

❌ ORPHANED PACKAGES (reseller_id not found in packages table):
   - ID: abc123-def456-ghi789
     Name: Example Package 1
     Country: United States
     Orphaned reseller_id: xyz789-invalid-id

📋 SUMMARY:
   - Data integrity: ❌ ISSUES FOUND
   - Duplicate prevention: ✅ GOOD
   - Missing reseller_ids: ⚠️ 3 FOUND
```

---

## 🔧 Automated Fixes (Node.js)

### Available Fix Options

The fix script can handle three types of issues:

1. **Remove Orphaned Records** (`--remove-orphaned`)
   - Deletes `my_packages` records with invalid `reseller_id`

2. **Fix Missing reseller_ids** (`--fix-missing-ids`)
   - Attempts to match packages without `reseller_id` to valid packages
   - Uses name similarity and data matching

3. **Remove Duplicates** (`--remove-duplicates`)
   - Removes duplicate `reseller_id` entries (keeps newest)

### Safety First: Dry Run

**Always run with `--dry-run` first** to see what would be changed:

```bash
# See what would be fixed (safe)
node fix_package_integrity.js --remove-orphaned --fix-missing-ids --remove-duplicates --dry-run
```

### Apply Fixes

```bash
# Remove only orphaned records
node fix_package_integrity.js --remove-orphaned

# Fix missing reseller_ids only
node fix_package_integrity.js --fix-missing-ids

# Fix all issues
node fix_package_integrity.js --remove-orphaned --fix-missing-ids --remove-duplicates

# Get help
node fix_package_integrity.js --help
```

### Sample Fix Output

```
🔧 Package Integrity Fix Script

🔍 Running initial verification...
[... verification output ...]

🗑️ Removing orphaned records...
   Found 2 orphaned records:
     - Example Package 1 (United States) - ID: abc123-def456-ghi789
     - Example Package 2 (Germany) - ID: def456-ghi789-jkl012
   ✅ Successfully removed 2 orphaned records

🔗 Fixing missing reseller_ids...
   Found 3 packages without reseller_id
   Found 2 potential matches:
     - "Europe 5GB" → "5GB Europe Package" (high)
     - "US Data Plan" → "USA Data 3GB" (medium)
   ✅ Successfully fixed 2 missing reseller_ids

📋 FIX SUMMARY:
   - Orphaned records removed: 2
   - Missing reseller_ids fixed: 2
   - Duplicate records removed: 0
```

---

## 🚨 Common Issues and Solutions

### Issue 1: Orphaned Records
**Problem**: `my_packages.reseller_id` points to non-existent `packages.id`
**Cause**: Package was deleted from `packages` table but not from `my_packages`
**Solution**: Run `--remove-orphaned` to clean up

### Issue 2: Missing reseller_ids
**Problem**: `my_packages` records have `NULL` reseller_id
**Cause**: Package was imported manually without proper reference
**Solution**: Run `--fix-missing-ids` to attempt automatic matching

### Issue 3: Duplicate reseller_ids
**Problem**: Multiple `my_packages` records point to same `packages.id`
**Cause**: Package was imported multiple times
**Solution**: Run `--remove-duplicates` to keep newest only

### Issue 4: Purchase Flow Errors
**Problem**: Users can't complete purchases
**Cause**: Frontend tries to purchase package with invalid reseller_id
**Solution**: Fix integrity issues and update frontend error handling

---

## 🔄 Regular Maintenance

### Recommended Schedule

1. **Weekly Verification**: Run `verify_package_integrity.js`
2. **Before Major Updates**: Run full verification before deploying
3. **After Package Sync**: Verify integrity after syncing from Roamify API
4. **When Issues Reported**: Run immediate verification and fixes

### Automation Ideas

```bash
# Add to your CI/CD pipeline
node verify_package_integrity.js && echo "Integrity check passed" || exit 1

# Add to package sync script
node sync_packages.js && node verify_package_integrity.js

# Weekly cron job
0 2 * * 0 cd /path/to/project && node verify_package_integrity.js
```

---

## 📊 Understanding the Output

### Health Status Indicators

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ HEALTHY | All references valid, no issues | None |
| ❌ ORPHANED RECORDS FOUND | Invalid reseller_ids exist | Run `--remove-orphaned` |
| ⚠️ DUPLICATES FOUND | Multiple records share reseller_id | Run `--remove-duplicates` |
| ⚠️ MISSING RESELLER IDS | Records without reseller_id | Run `--fix-missing-ids` |

### Key Metrics to Monitor

- **Valid References**: Should equal `my_packages` records with reseller_id
- **Orphaned Records**: Should always be 0
- **Missing reseller_ids**: Minimize but some may be intentional
- **Duplicates**: Should be 0 for data integrity

---

## 🛠️ Advanced Usage

### Custom Verification Query

```sql
-- Find packages that might need attention
SELECT 
  mp.id,
  mp.name,
  mp.country_name,
  mp.reseller_id,
  CASE 
    WHEN mp.reseller_id IS NULL THEN 'Missing reseller_id'
    WHEN p.id IS NULL THEN 'Orphaned record'
    ELSE 'Valid'
  END as status
FROM my_packages mp
LEFT JOIN packages p ON p.id::text = mp.reseller_id
WHERE mp.reseller_id IS NULL OR p.id IS NULL
ORDER BY mp.created_at DESC;
```

### Backup Before Fixes

```sql
-- Create backup table before running fixes
CREATE TABLE my_packages_backup AS SELECT * FROM my_packages;

-- Restore if needed
DELETE FROM my_packages;
INSERT INTO my_packages SELECT * FROM my_packages_backup;
```

---

## 🔧 Troubleshooting

### Script Won't Run
- Check Node.js version (requires v14+)
- Verify `.env` file has correct Supabase credentials
- Ensure network access to Supabase

### Permission Errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check RLS policies allow service role access

### Unexpected Results
- Run SQL verification first to cross-check
- Check for recent changes to table structure
- Verify packages sync completed successfully

---

## 📞 Support

If you encounter issues:

1. Run the SQL verification first
2. Check the detailed Node.js output
3. Use `--dry-run` to preview changes
4. Create database backup before fixes
5. Review this documentation

The system is designed to be safe and informative - always verify results before applying fixes in production. 