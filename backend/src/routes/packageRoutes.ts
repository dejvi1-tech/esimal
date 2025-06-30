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
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Admin-only routes for package management
router.get('/', asyncHandler(getAllPackages));
router.post('/', asyncHandler(createPackage));
router.get('/get-section-packages', asyncHandler(getSectionPackages));
router.get('/search-packages', asyncHandler(searchPackages));
router.get('/:id', asyncHandler(getPackage));
router.put('/:id', asyncHandler(updatePackage));
router.delete('/:id', asyncHandler(deletePackage));

export default router; 