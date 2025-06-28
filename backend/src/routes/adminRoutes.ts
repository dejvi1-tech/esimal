import { Router } from 'express';
const router = Router();
import { getAllPackages, getMyPackages, getAllRoamifyPackages } from '../controllers/packageController';
import { Request, Response } from 'express';
import { requireAdminAuth, adminLoginHandler } from '../middleware/auth';

router.get('/test', (req, res) => {
  res.json({ ok: true });
});

// Admin login route
router.post('/login', adminLoginHandler);

// Protect all admin data routes
router.use(requireAdminAuth);

// /api/admin/my-packages
router.get('/my-packages', getMyPackages);

// /api/admin/packages
router.get('/packages', getAllPackages);

// /api/admin/all-roamify-packages
router.get('/all-roamify-packages', getAllRoamifyPackages);

export default router; 