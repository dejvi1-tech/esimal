import { Router } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages, deduplicatePackages } from '../controllers/packageController';
import { requireAdminAuth, adminLoginHandler, adminLogoutHandler } from '../middleware/auth';

router.get('/test', (req, res) => {
  res.json({ ok: true });
});

// Admin login route (unprotected)
router.post('/login', adminLoginHandler);

// Admin logout route (unprotected)
router.post('/logout', adminLogoutHandler);

// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', requireAdminAuth, getMyPackages);
router.get('/packages', requireAdminAuth, getAllPackages);
router.get('/all-roamify-packages', requireAdminAuth, getAllRoamifyPackages);
router.post('/deduplicate-packages', requireAdminAuth, deduplicatePackages);

export default router; 