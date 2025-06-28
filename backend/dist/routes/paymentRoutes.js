"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
// Payment intent routes
router.post('/create-intent', rateLimiter_1.orderRateLimiter, (0, asyncHandler_1.asyncHandler)(paymentController_1.createPaymentIntent));
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map