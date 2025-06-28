import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController';
import { orderRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Payment intent routes
router.post('/create-intent', orderRateLimiter, asyncHandler(createPaymentIntent));

export default router; 