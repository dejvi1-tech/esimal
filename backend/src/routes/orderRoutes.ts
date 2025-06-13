import express from 'express';
import {
  createOrder,
  createGuestOrder,
  getOrderById,
  getUserOrders,
  cancelOrder,
  convertGuestToUser,
} from '../controllers/orderController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Guest routes (no auth required)
router.post('/guest', createGuestOrder);
router.post('/convert-guest', convertGuestToUser);

// Protected routes (require auth)
router.use(protect);
router.post('/', createOrder);
router.get('/user', getUserOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

export default router; 