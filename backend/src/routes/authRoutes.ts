import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(protect); // Apply protect middleware to all routes below
router.get('/me', getCurrentUser);
router.post('/logout', logout);

export default router; 