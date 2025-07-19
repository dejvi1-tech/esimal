"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const packageValidation_1 = require("../middleware/packageValidation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes for creating orders
router.post('/', rateLimiter_1.orderRateLimiter, packageValidation_1.validateCreateOrder, packageValidation_1.validatePackageBeforeCheckout, packageValidation_1.addValidationHeaders, async (req, res, next) => {
    try {
        await (0, orderController_1.createOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post('/my-packages', rateLimiter_1.orderRateLimiter, packageValidation_1.validateCreateOrder, packageValidation_1.validatePackageBeforeCheckout, packageValidation_1.addValidationHeaders, async (req, res, next) => {
    try {
        await (0, orderController_1.createMyPackageOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
// Get order details (public route)
router.get('/:orderId/details', async (req, res, next) => {
    try {
        await (0, orderController_1.getOrderDetails)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
// Admin-only routes for order management
router.get('/', auth_1.requireAdminAuth, async (req, res, next) => {
    try {
        await (0, orderController_1.getAllOrders)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', auth_1.requireAdminAuth, async (req, res, next) => {
    try {
        await (0, orderController_1.getOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id/status', packageValidation_1.validateUpdateOrderStatus, auth_1.requireAdminAuth, async (req, res, next) => {
    try {
        await (0, orderController_1.updateOrderStatus)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/cancel', packageValidation_1.validateCancelOrder, auth_1.requireAdminAuth, async (req, res, next) => {
    try {
        await (0, orderController_1.cancelOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map