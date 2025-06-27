"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripeController_1 = require("../controllers/stripeController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// Payment intent routes
router.post('/payment-intent', rateLimiter_1.orderRateLimiter, stripeController_1.createPaymentIntent);
router.post('/confirm-payment', rateLimiter_1.orderRateLimiter, stripeController_1.confirmPayment);
router.get('/payment-intent/:paymentIntentId', stripeController_1.getPaymentIntentStatus);
// Stripe Checkout Session
router.post('/create-checkout-session', stripeController_1.createCheckoutSession);
// Refund routes
router.post('/refund', stripeController_1.createRefund);
// Customer routes
router.get('/customer/:customerId', stripeController_1.getCustomer);
router.get('/customer/:customerId/payment-methods', stripeController_1.getCustomerPaymentMethods);
router.post('/payment-method/attach', stripeController_1.attachPaymentMethod);
router.delete('/payment-method/:paymentMethodId', stripeController_1.detachPaymentMethod);
exports.default = router;
//# sourceMappingURL=stripeRoutes.js.map