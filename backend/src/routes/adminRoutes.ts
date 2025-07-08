import { Router, Request, Response } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages, deduplicatePackages, getPackageCountries, syncRoamifyPackages, savePackage, deleteMyPackage, runCompletePackageSync } from '../controllers/packageController';
import { 
  debugOrder, 
  getPackageHealthOverview, 
  getSyncStatus, 
  triggerPackageValidation, 
  getInvalidPackages, 
  triggerManualSync, 
  clearPackageValidationCache,
  deduplicateMyPackages,
  fixPackagesRoamifyConfig,
  fixSpecificFailingPackage
} from '../controllers/adminController';
import { requireAdminAuth, adminLoginHandler, adminLogoutHandler } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import jwt from 'jsonwebtoken';
import csurf from 'csurf';
import { validateSavePackage } from '../middleware/packageValidation';
import { 
  validateDeduplicatePackages,
  validateSyncRoamifyPackages,
  validatePackagesValidate,
  validatePackagesSync,
  validateDeduplicateMyPackages,
  validateFixRoamifyConfig,
  validateFixSpecificFailingPackage,
  validateCompleteSync,
  validateFixInvalidIds,
  validateFindGermanyPackages
} from '../middleware/adminValidation';
const csrfProtection = csurf({ cookie: true });

router.get('/test', (req, res) => {
  res.json({ ok: true });
});

// CSRF token endpoint for admin
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Admin login route (unprotected)
router.post('/login', adminLoginHandler);

// Admin logout route (unprotected)
router.post('/logout', adminLogoutHandler);

// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', requireAdminAuth, asyncHandler(getMyPackages));
router.get('/packages', requireAdminAuth, asyncHandler(getAllPackages));
router.get('/all-roamify-packages', requireAdminAuth, asyncHandler(getAllRoamifyPackages));
router.get('/package-countries', requireAdminAuth, asyncHandler(getPackageCountries));
router.post('/deduplicate-packages', validateDeduplicatePackages, requireAdminAuth, csrfProtection, asyncHandler(deduplicatePackages));
router.post('/sync-roamify-packages', validateSyncRoamifyPackages, requireAdminAuth, csrfProtection, asyncHandler(syncRoamifyPackages));
router.post('/save-package', validateSavePackage, requireAdminAuth, csrfProtection, asyncHandler(savePackage));
router.delete('/delete-package/:id', requireAdminAuth, csrfProtection, asyncHandler(deleteMyPackage));

// Debug routes
router.get('/debug-order/:orderId', requireAdminAuth, asyncHandler(debugOrder));

// Package health and validation routes
router.get('/packages/health', requireAdminAuth, asyncHandler(getPackageHealthOverview));
router.get('/packages/sync-status', requireAdminAuth, asyncHandler(getSyncStatus));
router.post('/packages/validate', validatePackagesValidate, requireAdminAuth, csrfProtection, asyncHandler(triggerPackageValidation));
router.get('/packages/invalid', requireAdminAuth, asyncHandler(getInvalidPackages));
router.post('/packages/sync', validatePackagesSync, requireAdminAuth, csrfProtection, asyncHandler(triggerManualSync));
router.delete('/packages/validation-cache', requireAdminAuth, csrfProtection, asyncHandler(clearPackageValidationCache));
router.post('/packages/deduplicate-my-packages', validateDeduplicateMyPackages, requireAdminAuth, csrfProtection, asyncHandler(deduplicateMyPackages));
router.post('/packages/fix-roamify-config', validateFixRoamifyConfig, requireAdminAuth, csrfProtection, asyncHandler(fixPackagesRoamifyConfig));
router.post('/packages/fix-specific-failing-package', validateFixSpecificFailingPackage, requireAdminAuth, csrfProtection, asyncHandler(fixSpecificFailingPackage));

// 🚀 COMPLETE PACKAGE SYNC: Clear my_packages and sync with real Roamify package IDs
router.post('/packages/complete-sync', validateCompleteSync, requireAdminAuth, csrfProtection, asyncHandler(runCompletePackageSync));

// 🔧 TEMPORARY: Fix existing invalid package IDs
router.post('/packages/fix-invalid-ids', validateFixInvalidIds, requireAdminAuth, csrfProtection, async (req, res) => {
  try {
    const { fixExistingInvalidPackageIds } = require('../../fix_existing_invalid_package_ids');
    
    console.log('🔧 Admin triggered package ID fix...');
    await fixExistingInvalidPackageIds();
    
    res.json({
      status: 'success',
      message: 'Package ID fix completed successfully'
    });
  } catch (error) {
    console.error('Error running package ID fix:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run package ID fix',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🇩🇪 TEMPORARY: Find correct Germany packages
router.post('/packages/find-germany-packages', validateFindGermanyPackages, requireAdminAuth, csrfProtection, async (req, res) => {
  try {
    console.log('🔧 Admin triggered Germany package finder...');
    
    const { createClient } = require('@supabase/supabase-js');
    const axios = require('axios');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch packages from Roamify
    const response = await axios.get(`${process.env.ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const countries = response.data.data?.packages || [];
    
    // Find Germany packages
    const germanyCountries = countries.filter((country: any) => 
      country.countryName?.toLowerCase().includes('germany') ||
      country.countryName?.toLowerCase().includes('deutschland') ||
      country.countryCode?.toLowerCase() === 'de'
    );

    let germanyPackages: any[] = [];
    germanyCountries.forEach((country: any) => {
      if (country.packages && Array.isArray(country.packages)) {
        country.packages.forEach((pkg: any) => {
          germanyPackages.push({
            packageId: pkg.packageId,
            name: pkg.package,
            country: country.countryName,
            countryCode: country.countryCode,
            dataAmount: pkg.dataAmount,
            dataUnit: pkg.dataUnit,
            days: pkg.day,
            price: pkg.price
          });
        });
      }
    });

    // Find 1GB packages
    const oneGBPackages = germanyPackages.filter(pkg => 
      (pkg.dataAmount === 1 && pkg.dataUnit === 'GB') ||
      (pkg.dataAmount === 1024 && pkg.dataUnit === 'MB') ||
      pkg.name?.toLowerCase().includes('1gb')
    );

    if (oneGBPackages.length > 0) {
      // Update the specific package
      const correctPackageId = oneGBPackages[0].packageId;
      
      const { error: updateError } = await supabase
        .from('my_packages')
        .update({
          features: {
            packageId: correctPackageId,
            originalPackageId: 'esim-de-30days-1gb-all',
            fallbackPackageId: 'esim-europe-30days-3gb-all',
            correctedAt: new Date().toISOString(),
            correctionReason: 'Updated to use real Germany 1GB package from Roamify API'
          }
        })
        .eq('id', 'cd837948-dcab-487b-b080-4112e5c3d0e6');

      if (updateError) {
        throw updateError;
      }

      res.json({
        status: 'success',
        message: `Updated package to use real Germany package: ${correctPackageId}`,
        data: {
          oldPackageId: 'esim-europe-30days-3gb-all',
          newPackageId: correctPackageId,
          packageName: oneGBPackages[0].name,
          germanyPackagesFound: germanyPackages.length,
          oneGBOptionsFound: oneGBPackages.length
        }
      });
    } else {
      res.json({
        status: 'warning',
        message: 'No 1GB Germany packages found',
        data: {
          germanyPackagesFound: germanyPackages.length,
          availableOptions: germanyPackages.map(pkg => ({
            packageId: pkg.packageId,
            name: pkg.name,
            data: `${pkg.dataAmount} ${pkg.dataUnit}`,
            price: pkg.price
          }))
        }
      });
    }
    
  } catch (error) {
    console.error('Error finding Germany packages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to find Germany packages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/admin-check', ((req: any, res: any) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret');
    return res.status(200).json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}) as any);

export default router; 