"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const packageController_1 = require("../controllers/packageController");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
router.get('/test', (req, res) => {
    res.json({ ok: true });
});
// Admin login route (unprotected)
router.post('/login', auth_1.adminLoginHandler);
// Admin logout route (unprotected)
router.post('/logout', auth_1.adminLogoutHandler);
// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.getMyPackages));
router.get('/packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.getAllPackages));
router.get('/all-roamify-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.getAllRoamifyPackages));
router.get('/package-countries', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.getPackageCountries));
router.post('/deduplicate-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.deduplicatePackages));
router.post('/sync-roamify-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.syncRoamifyPackages));
router.post('/save-package', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.savePackage));
router.delete('/delete-package/:id', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.deleteMyPackage));
// Debug routes
router.get('/debug-order/:orderId', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.debugOrder));
// Package health and validation routes
router.get('/packages/health', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getPackageHealthOverview));
router.get('/packages/sync-status', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getSyncStatus));
router.post('/packages/validate', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.triggerPackageValidation));
router.get('/packages/invalid', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getInvalidPackages));
router.post('/packages/sync', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.triggerManualSync));
router.delete('/packages/validation-cache', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.clearPackageValidationCache));
router.post('/packages/deduplicate-my-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.deduplicateMyPackages));
router.post('/packages/fix-roamify-config', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.fixPackagesRoamifyConfig));
router.post('/packages/fix-specific-failing-package', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.fixSpecificFailingPackage));
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map