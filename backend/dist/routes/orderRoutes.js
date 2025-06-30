"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// Public routes for creating orders
router.post('/', rateLimiter_1.orderRateLimiter, async (req, res, next) => {
    try {
        await (0, orderController_1.createOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post('/my-packages', rateLimiter_1.orderRateLimiter, async (req, res, next) => {
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
router.get('/', async (req, res, next) => {
    try {
        await (0, orderController_1.getAllOrders)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        await (0, orderController_1.getOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id/status', async (req, res, next) => {
    try {
        await (0, orderController_1.updateOrderStatus)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/cancel', async (req, res, next) => {
    try {
        await (0, orderController_1.cancelOrder)(req, res, next);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map