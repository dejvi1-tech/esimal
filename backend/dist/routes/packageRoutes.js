"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const packageController_1 = require("../controllers/packageController");
const auth_1 = require("../middleware/auth");
const packageValidation_1 = require("../middleware/packageValidation");
const router = express_1.default.Router();
// Admin-only routes for package management
router.get('/', async (req, res, next) => {
    try {
        await (0, packageController_1.getAllPackages)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', auth_1.requireAdminAuth, packageValidation_1.validateCreatePackage, async (req, res, next) => {
    try {
        await (0, packageController_1.createPackage)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get('/get-section-packages', async (req, res, next) => {
    try {
        await (0, packageController_1.getSectionPackages)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get('/search-packages', async (req, res, next) => {
    try {
        await (0, packageController_1.searchPackages)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        await (0, packageController_1.getPackage)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', auth_1.requireAdminAuth, packageValidation_1.validateUpdatePackage, async (req, res, next) => {
    try {
        await (0, packageController_1.updatePackage)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', auth_1.requireAdminAuth, async (req, res, next) => {
    try {
        await (0, packageController_1.deletePackage)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=packageRoutes.js.map