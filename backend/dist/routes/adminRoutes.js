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
// 🚀 COMPLETE PACKAGE SYNC: Clear my_packages and sync with real Roamify package IDs
router.post('/packages/complete-sync', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(packageController_1.runCompletePackageSync));
// 🔧 TEMPORARY: Fix existing invalid package IDs
router.post('/packages/fix-invalid-ids', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
}));
// 🇩🇪 TEMPORARY: Find correct Germany packages
router.post('/packages/find-germany-packages', auth_1.requireAdminAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
}));
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map