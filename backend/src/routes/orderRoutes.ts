import express from 'express';
import {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  createOrder,
  createMyPackageOrder,
  getOrderDetails,
} from '../controllers/orderController';
import { orderRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes for creating orders
router.post('/', orderRateLimiter, createOrder);
router.post('/my-packages', orderRateLimiter, createMyPackageOrder);

// Get order details (public route)
router.get('/:orderId/details', getOrderDetails);

// Admin-only routes for order management
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

export default router; 