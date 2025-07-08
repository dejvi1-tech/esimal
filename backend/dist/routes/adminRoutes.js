"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const packageController_1 = require("../controllers/packageController");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const csurf_1 = __importDefault(require("csurf"));
const packageValidation_1 = require("../middleware/packageValidation");
const adminValidation_1 = require("../middleware/adminValidation");
const csrfProtection = (0, csurf_1.default)({ cookie: true });
router.get('/test', (req, res) => {
    res.json({ ok: true });
});
// CSRF token endpoint for admin
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
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
router.post('/deduplicate-packages', adminValidation_1.validateDeduplicatePackages, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(packageController_1.deduplicatePackages));
router.post('/sync-roamify-packages', adminValidation_1.validateSyncRoamifyPackages, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(packageController_1.syncRoamifyPackages));
router.post('/save-package', packageValidation_1.validateSavePackage, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(packageController_1.savePackage));
router.delete('/delete-package/:id', auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(packageController_1.deleteMyPackage));
// Debug routes
router.get('/debug-order/:orderId', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.debugOrder));
// Package health and validation routes
router.get('/packages/health', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getPackageHealthOverview));
router.get('/packages/sync-status', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getSyncStatus));
router.post('/packages/validate', adminValidation_1.validatePackagesValidate, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.triggerPackageValidation));
router.get('/packages/invalid', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(adminController_1.getInvalidPackages));
router.post('/packages/sync', adminValidation_1.validatePackagesSync, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.triggerManualSync));
router.delete('/packages/validation-cache', auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.clearPackageValidationCache));
router.post('/packages/deduplicate-my-packages', adminValidation_1.validateDeduplicateMyPackages, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.deduplicateMyPackages));
router.post('/packages/fix-roamify-config', adminValidation_1.validateFixRoamifyConfig, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.fixPackagesRoamifyConfig));
router.post('/packages/fix-specific-failing-package', adminValidation_1.validateFixSpecificFailingPackage, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(adminController_1.fixSpecificFailingPackage));
// 🚀 COMPLETE PACKAGE SYNC: Clear my_packages and sync with real Roamify package IDs
router.post('/packages/complete-sync', adminValidation_1.validateCompleteSync, auth_1.requireAdminAuth, csrfProtection, (0, asyncHandler_1.asyncHandler)(packageController_1.runCompletePackageSync));
// 🔧 TEMPORARY: Fix existing invalid package IDs
router.post('/packages/fix-invalid-ids', adminValidation_1.validateFixInvalidIds, auth_1.requireAdminAuth, csrfProtection, async (req, res) => {
    try {
        const { fixExistingInvalidPackageIds } = require('../../fix_existing_invalid_package_ids');
        console.log('🔧 Admin triggered package ID fix...');
        await fixExistingInvalidPackageIds();
        res.json({
            status: 'success',
            message: 'Package ID fix completed successfully'
        });
    }
    catch (error) {
        console.error('Error running package ID fix:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to run package ID fix',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 🇩🇪 TEMPORARY: Find correct Germany packages
router.post('/packages/find-germany-packages', adminValidation_1.validateFindGermanyPackages, auth_1.requireAdminAuth, csrfProtection, async (req, res) => {
    try {
        console.log('🔧 Admin triggered Germany package finder...');
        const { createClient } = require('@supabase/supabase-js');
        const axios = require('axios');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
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
        const germanyCountries = countries.filter((country) => country.countryName?.toLowerCase().includes('germany') ||
            country.countryName?.toLowerCase().includes('deutschland') ||
            country.countryCode?.toLowerCase() === 'de');
        let germanyPackages = [];
        germanyCountries.forEach((country) => {
            if (country.packages && Array.isArray(country.packages)) {
                country.packages.forEach((pkg) => {
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
        const oneGBPackages = germanyPackages.filter(pkg => (pkg.dataAmount === 1 && pkg.dataUnit === 'GB') ||
            (pkg.dataAmount === 1024 && pkg.dataUnit === 'MB') ||
            pkg.name?.toLowerCase().includes('1gb'));
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error finding Germany packages:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to find Germany packages',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/admin-check', ((req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-default-secret');
        return res.status(200).json({ success: true, user: decoded });
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}));
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map