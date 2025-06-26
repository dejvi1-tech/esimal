import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  getUserTransactions, 
  getAccountBalanceFromRoamify 
} from '../controllers/accountController';

const router = express.Router();

// Admin-only routes for user management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/transactions', getUserTransactions);

// Get account balance from Roamify
router.get('/balance-roamify', getAccountBalanceFromRoamify);

export default router; 