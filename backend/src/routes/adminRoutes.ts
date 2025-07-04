import { Router } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages, deduplicatePackages, getPackageCountries, syncRoamifyPackages, savePackage, deleteMyPackage, clearAllPackages } from '../controllers/packageController';
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

router.get('/test', (req, res) => {
  res.json({ ok: true });
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
router.post('/deduplicate-packages', requireAdminAuth, asyncHandler(deduplicatePackages));
router.delete('/clear-all-packages', requireAdminAuth, asyncHandler(clearAllPackages));
router.post('/sync-roamify-packages', requireAdminAuth, asyncHandler(syncRoamifyPackages));
router.post('/save-package', requireAdminAuth, asyncHandler(savePackage));
router.delete('/delete-package/:id', requireAdminAuth, asyncHandler(deleteMyPackage));

// Debug routes
router.get('/debug-order/:orderId', requireAdminAuth, asyncHandler(debugOrder));

// Package health and validation routes
router.get('/packages/health', requireAdminAuth, asyncHandler(getPackageHealthOverview));
router.get('/packages/sync-status', requireAdminAuth, asyncHandler(getSyncStatus));
router.post('/packages/validate', requireAdminAuth, asyncHandler(triggerPackageValidation));
router.get('/packages/invalid', requireAdminAuth, asyncHandler(getInvalidPackages));
router.post('/packages/sync', requireAdminAuth, asyncHandler(triggerManualSync));
router.delete('/packages/validation-cache', requireAdminAuth, asyncHandler(clearPackageValidationCache));
router.post('/packages/deduplicate-my-packages', requireAdminAuth, asyncHandler(deduplicateMyPackages));
router.post('/packages/fix-roamify-config', requireAdminAuth, asyncHandler(fixPackagesRoamifyConfig));
router.post('/packages/fix-specific-failing-package', requireAdminAuth, asyncHandler(fixSpecificFailingPackage));

export default router; 