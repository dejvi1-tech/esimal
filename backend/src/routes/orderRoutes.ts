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
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Public routes for creating orders
router.post('/', orderRateLimiter, asyncHandler(createOrder));
router.post('/my-packages', orderRateLimiter, asyncHandler(createMyPackageOrder));

// Get order details (public route)
router.get('/:orderId/details', asyncHandler(getOrderDetails));

// Admin-only routes for order management
router.get('/', asyncHandler(getAllOrders));
router.get('/:id', asyncHandler(getOrder));
router.put('/:id/status', asyncHandler(updateOrderStatus));
router.post('/:id/cancel', asyncHandler(cancelOrder));

export default router; 