# Data Integrity Check Guide: my_packages vs packages

## 🎯 **Purpose**
Ensure that all packages in your curated `my_packages` table have valid references to the source `packages` table. This prevents purchase failures and maintains data consistency.

## 📊 **The Problem**
- **`packages`**: 11,000+ eSIM packages from Roamify API
- **`my_packages`**: Your curated ~153 packages for frontend
- **Risk**: Customer buys package that no longer exists → Purchase fails

## 🔍 **What We Check**
For each entry in `my_packages`, verify:
1. ✅ **ID exists** in `packages` table
2. ✅ **Country matches** between both tables
3. ✅ **Package is still active** and available

## 🚀 **Three Methods Available**

### **Method 1: Quick Check (2 minutes)**
**Best for:** Immediate validation before allowing purchases

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy & paste:** `QUICK_INTEGRITY_CHECK.sql`
3. **Click "Run"**

**Expected output:**
- List of any problematic packages
- Summary with integrity percentage

### **Method 2: Comprehensive SQL Analysis**
**Best for:** Detailed investigation of all issues

1. **Go to Supabase Dashboard** → SQL Editor  
2. **Copy & paste:** `backend/data_integrity_check.sql`
3. **Click "Run"**

**What it shows:**
- Missing package IDs
- Country mismatches  
- Field differences
- Cleanup recommendations

### **Method 3: Node.js Script (Full Analysis + Auto-Fix)**
**Best for:** Automated checking and fixing

```bash
# Analysis only
node data_integrity_check.js

# With auto-fixes
node data_integrity_check.js --remove-missing --fix-countries
```

## 📋 **Expected Results**

### **Perfect Integrity (Goal):**
```
Total my_packages: 153
Valid references: 153 (100%)
Broken references: 0 (0%)
Integrity percentage: 100%
```

### **Issues Found:**
```sql
-- Example broken reference
id: "abc123..."
name: "Germany 5GB Package"  
country_name: "Germany"
status: "❌ Package ID not found in source"

-- Example country mismatch  
id: "def456..."
name: "France 3GB Package"
my_packages country: "France"
packages country: "Europe & United States"
status: "⚠️ Country mismatch"
```

## 🔧 **How to Fix Issues**

### **Issue Type 1: Missing Package IDs**
**Problem:** Package no longer exists in source data
**Solution:** Remove from my_packages
```sql
DELETE FROM my_packages WHERE id = 'missing-package-id';
```

### **Issue Type 2: Country Mismatches**  
**Problem:** Package exists but country changed in source
**Options:**
1. **Update to match source:**
   ```sql
   UPDATE my_packages 
   SET country_name = 'New Country Name' 
   WHERE id = 'package-id';
   ```
2. **Remove and re-add** with correct country

### **Issue Type 3: Field Differences**
**Problem:** Name, data_amount, or days differ from source
**Action:** Decide if your custom values should be preserved or synced

## ⚡ **Automated Fixes**

The Node.js script can automatically fix issues:

```bash
# Remove packages with broken ID references
node data_integrity_check.js --remove-missing

# Fix country name mismatches  
node data_integrity_check.js --fix-countries

# Sync name/data/days fields with source
node data_integrity_check.js --sync-fields

# All fixes at once
node data_integrity_check.js --remove-missing --fix-countries --sync-fields
```

## 📅 **Recommended Schedule**

### **Before Major Updates:**
- Run integrity check before any package sync
- Fix issues before allowing new purchases

### **Weekly Monitoring:**
- Quick check with `QUICK_INTEGRITY_CHECK.sql`
- Should show 100% integrity

### **After Roamify API Changes:**
- Full analysis with comprehensive SQL
- Review any field differences

## 🚨 **Critical Situations**

### **Before Going Live:**
```sql
-- Must return 0 broken references
SELECT COUNT(*) as broken_references
FROM my_packages mp
WHERE NOT EXISTS (
  SELECT 1 FROM packages p 
  WHERE p.id = mp.id AND p.country_name = mp.country_name
);
```

### **Emergency Check (Customer Purchase Failed):**
```sql
-- Check specific package
SELECT 
  mp.*, 
  p.id as source_exists,
  p.country_name as source_country
FROM my_packages mp
LEFT JOIN packages p ON mp.id = p.id
WHERE mp.id = 'failing-package-id';
```

## 📊 **Files Created**

1. ✅ `QUICK_INTEGRITY_CHECK.sql` - Fastest check (2 min)
2. ✅ `backend/data_integrity_check.sql` - Comprehensive analysis  
3. ✅ `backend/data_integrity_check.js` - Full script with auto-fix
4. ✅ `DATA_INTEGRITY_GUIDE.md` - This guide

## 🎯 **Success Criteria**

After running checks and fixes:
- ✅ **100% integrity** - All my_packages have valid references
- ✅ **No broken IDs** - All package IDs exist in source
- ✅ **Consistent countries** - Country names match between tables
- ✅ **Purchase confidence** - Customer orders will succeed
- ✅ **Clean admin panel** - No outdated packages displayed

## 🔄 **Integration with Your Workflow**

1. **Package Sync Process:**
   - Sync packages from Roamify → `packages` table
   - Run integrity check on `my_packages`
   - Fix any broken references
   - Deploy frontend updates

2. **Before Purchase Processing:**
   - Validate package exists and matches
   - Check integrity in real-time if needed

3. **Admin Panel Integration:**
   - Show integrity status in admin dashboard
   - Highlight packages needing review
   - Auto-fix buttons for common issues

---

## 🚀 **Quick Start**

**Right now, run this in Supabase Dashboard:**

```sql
-- Quick integrity check (30 seconds)
SELECT 
  COUNT(*) as total_packages,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM packages p 
    WHERE p.id = mp.id AND p.country_name = mp.country_name
  )) as valid_packages,
  ROUND(
    COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM packages p 
      WHERE p.id = mp.id AND p.country_name = mp.country_name
    )) * 100.0 / COUNT(*), 1
  ) as integrity_percentage
FROM my_packages mp;
```

If integrity is **100%** → You're good to go! 🎉  
If integrity is **< 100%** → Run the full check to see what needs fixing.

**Ready to check your data integrity?** Start with the quick check! 🚀 