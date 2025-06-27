import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntentStatus,
  createRefund,
  getCustomerPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  getCustomer,
  createCheckoutSession,
} from '../controllers/stripeController';
import { orderRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Payment intent routes
router.post('/payment-intent', orderRateLimiter, asyncHandler(createPaymentIntent));
router.post('/confirm-payment', orderRateLimiter, asyncHandler(confirmPayment));
router.get('/payment-intent/:paymentIntentId', asyncHandler(getPaymentIntentStatus));

// Stripe Checkout Session
router.post('/create-checkout-session', asyncHandler(createCheckoutSession));

// Refund routes
router.post('/refund', asyncHandler(createRefund));

// Customer routes
router.get('/customer/:customerId', asyncHandler(getCustomer));
router.get('/customer/:customerId/payment-methods', asyncHandler(getCustomerPaymentMethods));
router.post('/payment-method/attach', asyncHandler(attachPaymentMethod));
router.delete('/payment-method/:paymentMethodId', asyncHandler(detachPaymentMethod));

export default router; 