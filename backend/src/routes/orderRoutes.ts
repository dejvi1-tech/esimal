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
router.post('/', orderRateLimiter, async (req, res, next): Promise<void> => {
  try {
    await createOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.post('/my-packages', orderRateLimiter, async (req, res, next): Promise<void> => {
  try {
    await createMyPackageOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Get order details (public route)
router.get('/:orderId/details', async (req, res, next): Promise<void> => {
  try {
    await getOrderDetails(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Admin-only routes for order management
router.get('/', async (req, res, next): Promise<void> => {
  try {
    await getAllOrders(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.get('/:id', async (req, res, next): Promise<void> => {
  try {
    await getOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.put('/:id/status', async (req, res, next): Promise<void> => {
  try {
    await updateOrderStatus(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.post('/:id/cancel', async (req, res, next): Promise<void> => {
  try {
    await cancelOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router; 