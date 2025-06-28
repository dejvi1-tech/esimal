"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const packageController_1 = require("../controllers/packageController");
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
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map