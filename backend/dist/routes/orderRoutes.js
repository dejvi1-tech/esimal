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
router.post('/', rateLimiter_1.orderRateLimiter, orderController_1.createOrder);
router.post('/my-packages', rateLimiter_1.orderRateLimiter, orderController_1.createMyPackageOrder);
// Get order details (public route)
router.get('/:orderId/details', orderController_1.getOrderDetails);
// Admin-only routes for order management
router.get('/', orderController_1.getAllOrders);
router.get('/:id', orderController_1.getOrder);
router.put('/:id/status', orderController_1.updateOrderStatus);
router.post('/:id/cancel', orderController_1.cancelOrder);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map