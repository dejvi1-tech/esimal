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
router.get('/', async (req, res, next): Promise<void> => {
  try {
    await getAllPackages(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.post('/', async (req, res, next): Promise<void> => {
  try {
    await createPackage(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.get('/get-section-packages', async (req, res, next): Promise<void> => {
  try {
    await getSectionPackages(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.get('/search-packages', async (req, res, next): Promise<void> => {
  try {
    await searchPackages(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.get('/:id', async (req, res, next): Promise<void> => {
  try {
    await getPackage(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.put('/:id', async (req, res, next): Promise<void> => {
  try {
    await updatePackage(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.delete('/:id', async (req, res, next): Promise<void> => {
  try {
    await deletePackage(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router; 