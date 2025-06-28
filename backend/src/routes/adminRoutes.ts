import { Router } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages, deduplicatePackages } from '../controllers/packageController';
import { requireAdminAuth, adminLoginHandler, adminLogoutHandler } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

router.get('/test', (req, res) => {
  res.json({ ok: true });
});

// Admin login route (unprotected)
router.post('/login', adminLoginHandler);

// Admin logout route (unprotected)
router.post('/logout', adminLogoutHandler);

// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', requireAdminAuth, asyncHandler(getMyPackages));
router.get('/packages', requireAdminAuth, asyncHandler(getAllPackages));
router.get('/all-roamify-packages', requireAdminAuth, asyncHandler(getAllRoamifyPackages));
router.post('/deduplicate-packages', requireAdminAuth, asyncHandler(deduplicatePackages));

export default router; 