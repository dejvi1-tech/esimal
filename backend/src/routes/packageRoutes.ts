import express from 'express';
import {
  createPackage,
  getAllPackages,
  getPackage,
  updatePackage,
  deletePackage,
  getSectionPackages,
  searchPackages,
} from '../controllers/packageController';

const router = express.Router();

// Admin-only routes for package management
router.get('/', getAllPackages);
router.post('/', createPackage);
router.get('/get-section-packages', getSectionPackages);
router.get('/search-packages', searchPackages);
router.get('/:id', getPackage);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router; 