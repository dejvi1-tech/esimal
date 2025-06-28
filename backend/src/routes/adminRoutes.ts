import { Router } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages } from '../controllers/packageController';
import { requireAdminAuth, adminLoginHandler } from '../middleware/auth';

router.get('/test', (req, res) => {
  res.json({ ok: true });
});

// Admin login route (unprotected)
router.post('/login', adminLoginHandler);

// Protected admin routes - each route needs the middleware explicitly
router.get('/my-packages', requireAdminAuth, getMyPackages);
router.get('/packages', requireAdminAuth, getAllPackages);
router.get('/all-roamify-packages', requireAdminAuth, getAllRoamifyPackages);

export default router; 