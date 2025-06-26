import express from 'express';
import {
  createPackage,
  getAllPackages,
  getPackage,
  updatePackage,
  deletePackage,
} from '../controllers/packageController';

const router = express.Router();

// Admin-only routes for package management
router.get('/', getAllPackages);
router.post('/', createPackage);
router.get('/:id', getPackage);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router; 