"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const packageController_1 = require("../controllers/packageController");
const auth_1 = require("../middleware/auth");
router.get('/test', (req, res) => {
    res.json({ ok: true });
});
// Admin login route (unprotected)
router.post('/login', auth_1.adminLoginHandler);
// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', auth_1.requireAdminAuth, packageController_1.getMyPackages);
router.get('/packages', auth_1.requireAdminAuth, packageController_1.getAllPackages);
router.get('/all-roamify-packages', auth_1.requireAdminAuth, packageController_1.getAllRoamifyPackages);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map