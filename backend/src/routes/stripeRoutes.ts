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

const router = express.Router();

// Payment intent routes
router.post('/payment-intent', orderRateLimiter, createPaymentIntent);
router.post('/confirm-payment', orderRateLimiter, confirmPayment);
router.get('/payment-intent/:paymentIntentId', getPaymentIntentStatus);

// Stripe Checkout Session
router.post('/create-checkout-session', createCheckoutSession);

// Refund routes
router.post('/refund', createRefund);

// Customer routes
router.get('/customer/:customerId', getCustomer);
router.get('/customer/:customerId/payment-methods', getCustomerPaymentMethods);
router.post('/payment-method/attach', attachPaymentMethod);
router.delete('/payment-method/:paymentMethodId', detachPaymentMethod);

export default router; 