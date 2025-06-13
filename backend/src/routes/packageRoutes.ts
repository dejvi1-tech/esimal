import express from 'express';
import {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} from '../controllers/packageController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createPackage);
router.patch('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router; 