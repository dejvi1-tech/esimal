# Continuous Sync Deployment Guide

## Overview

This guide covers deploying the **comprehensive package management system** that prevents Roamify 500 errors and ensures data integrity through automated syncing and validation.

## System Components

### 1. Enhanced Roamify Service with Fallbacks
- **File**: `backend/src/services/roamifyService.ts`
- **Purpose**: Automatic fallback mechanism for failed package IDs
- **Features**: 
  - Region-specific fallback packages
  - Automatic retry with fallbacks on 500 errors
  - Smart package selection based on country/region

### 2. Scheduled Package Sync (Automated)
- **File**: `backend/scripts/scheduledPackageSync.js`
- **Purpose**: Daily validation and fixing of package mappings
- **Schedule**: 2 AM UTC daily
- **Features**:
  - Validates existing package mappings
  - Auto-fixes invalid package IDs
  - Comprehensive logging and reporting

### 3. Enhanced Package Sync Tool (Manual)
- **File**: `backend/scripts/enhancedPackageSync.js`
- **Purpose**: Complete package sync from Roamify to database
- **Features**:
  - **Built-in deduplication** - prevents duplicate IDs
  - Uses deterministic UUIDs based on `reseller_id`
  - Upserts with conflict resolution on `reseller_id`
  - Comprehensive CLI interface

### 4. Package Validation Middleware
- **File**: `backend/src/middleware/packageValidation.ts`
- **Purpose**: Pre-checkout package validation
- **Features**:
  - Real-time package validation
  - 1-hour caching for performance
  - Alternative package suggestions

### 5. Admin Dashboard Endpoints
- **File**: `backend/src/controllers/adminController.ts`
- **New endpoints for package management**:
  - Package health monitoring
  - Manual sync triggers
  - Validation cache management
  - **My Packages deduplication**

### 6. Deduplication System
- **New Feature**: Prevents duplicate IDs in admin panel
- **Two-tier approach**:
  1. **Packages table**: Uses `reseller_id` for conflict resolution
  2. **My Packages table**: Dedicated deduplication endpoint
- **Smart deduplication**: Keeps most complete and recent records

## Deployment Steps

### Phase 1: Core Infrastructure

1. **Install Dependencies**
   ```bash
   cd backend
   npm install node-cron @types/node-cron
   ```

2. **Build and Test Scripts**
   ```bash
   # Test enhanced sync
   node scripts/enhancedPackageSync.js --help
   
   # Test validation
   node scripts/validatePackageMappings.js --help
   
   # Build TypeScript
   npm run build
   ```

### Phase 2: Database Setup

1. **Ensure Unique Constraints**
   ```sql
   -- Add unique constraint on reseller_id for packages table
   ALTER TABLE packages ADD CONSTRAINT packages_reseller_id_unique UNIQUE (reseller_id);
   
   -- Create index for performance
   CREATE INDEX IF NOT EXISTS idx_packages_reseller_id ON packages(reseller_id);
   CREATE INDEX IF NOT EXISTS idx_my_packages_reseller_id ON my_packages(reseller_id);
   ```

### Phase 3: Deploy Enhanced Sync System

1. **Deploy Enhanced Scripts**
   ```bash
   # Copy scripts to production
   cp scripts/enhancedPackageSync.js /production/backend/scripts/
   cp scripts/scheduledPackageSync.js /production/backend/scripts/
   cp scripts/validatePackageMappings.js /production/backend/scripts/
   ```

2. **Start Scheduled Sync Service**
   ```bash
   # Run as daemon/service
   node scripts/scheduledPackageSync.js &
   
   # Or use PM2
   pm2 start scripts/scheduledPackageSync.js --name "package-sync"
   ```

### Phase 4: Deploy API Enhancements

1. **Deploy Enhanced Controllers**
   ```bash
   # Deploy updated controllers and middleware
   npm run build
   npm restart
   ```

2. **Test New Endpoints**
   ```bash
   # Test package health
   curl -X GET https://your-api.com/api/admin/packages/health \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   
   # Test deduplication
   curl -X POST https://your-api.com/api/admin/packages/deduplicate-my-packages \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

## API Endpoints

### Package Management

| Method | Endpoint | Purpose | Key Feature |
|--------|----------|---------|-------------|
| GET | `/api/admin/packages/health` | Package health overview | Real-time validation status |
| GET | `/api/admin/packages/sync-status` | Sync status monitoring | Last sync results |
| POST | `/api/admin/packages/validate` | Manual validation trigger | On-demand validation |
| GET | `/api/admin/packages/invalid` | Invalid package reports | Detailed error reports |
| POST | `/api/admin/packages/sync` | Manual sync trigger | Emergency sync capability |
| DELETE | `/api/admin/packages/validation-cache` | Cache management | Performance optimization |
| **POST** | **`/api/admin/packages/deduplicate-my-packages`** | **Remove duplicates** | **Prevents duplicate IDs** |

### Enhanced Deduplication Features

**Two-Level Deduplication System:**

1. **Packages Table** (Automatic):
   ```javascript
   // Uses reseller_id for upsert conflict resolution
   .upsert(packages, { 
     onConflict: 'reseller_id',
     ignoreDuplicates: false 
   })
   ```

2. **My Packages Table** (Manual/Automated):
   ```bash
   # Manual deduplication via API
   POST /api/admin/packages/deduplicate-my-packages
   
   # Returns:
   {
     "status": "success",
     "removedCount": 15,
     "details": {
       "resellerIdDuplicates": 8,
       "combinationDuplicates": 7
     }
   }
   ```

## Monitoring and Troubleshooting

### Health Check Dashboard

```bash
# Check overall package health
curl -X GET /api/admin/packages/health

# Response includes:
{
  "totalPackages": 1250,
  "validPackages": 1200,
  "invalidPackages": 50,
  "healthScore": 96.0,
  "lastValidation": "2025-01-03T14:30:00Z"
}
```

### Duplicate Prevention Verification

```bash
# 1. Run enhanced sync with deduplication
node scripts/enhancedPackageSync.js --no-clear

# 2. Check for duplicates in packages table
SELECT reseller_id, COUNT(*) as count 
FROM packages 
WHERE reseller_id IS NOT NULL 
GROUP BY reseller_id 
HAVING COUNT(*) > 1;

# 3. Deduplicate my_packages if needed
curl -X POST /api/admin/packages/deduplicate-my-packages

# 4. Verify no duplicates remain
SELECT reseller_id, COUNT(*) as count 
FROM my_packages 
WHERE reseller_id IS NOT NULL 
GROUP BY reseller_id 
HAVING COUNT(*) > 1;
```

## Expected Outcomes

### Immediate Benefits

✅ **Zero Duplicate IDs**: Built-in deduplication prevents duplicate packages  
✅ **Zero 500 Errors**: Automatic fallbacks ensure order completion  
✅ **Self-Healing**: Automated fixing of invalid package mappings  
✅ **Data Integrity**: Comprehensive validation and monitoring  

### Long-term Benefits

📈 **Revenue Protection**: No lost orders due to technical failures  
🔄 **Automated Maintenance**: Reduced manual intervention requirements  
📊 **Full Transparency**: Comprehensive admin dashboard and reporting  
🛡️ **Business Continuity**: Resilient system with multiple fallback layers  

## Rollback Plan

If issues occur:

1. **Disable Scheduled Sync**
   ```bash
   pm2 stop package-sync
   ```

2. **Revert to Manual Sync**
   ```bash
   # Use original package sync
   curl -X POST /api/admin/sync-packages
   ```

3. **Emergency Fallback**
   ```bash
   # Restore from backup
   pg_restore --clean --if-exists -d $DATABASE_URL backup.sql
   ```

## Success Criteria

- ✅ No Roamify 500 errors in production logs
- ✅ No duplicate package IDs in admin panel
- ✅ Package health score > 95%
- ✅ Automated daily sync running successfully
- ✅ Admin dashboard fully functional 