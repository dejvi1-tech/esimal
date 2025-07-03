import express from 'express';
import { syncRoamifyPackages, getSyncStatus, copyToMyPackages } from '../controllers/syncController';
import { requireAdminAuth } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// All sync routes require admin authentication
router.use(requireAdminAuth);

/**
 * POST /api/sync/roamify-packages
 * Sync all packages from Roamify API to packages table
 */
router.post('/roamify-packages', asyncHandler(syncRoamifyPackages));

/**
 * GET /api/sync/status
 * Get sync status and statistics
 */
router.get('/status', asyncHandler(getSyncStatus));

/**
 * POST /api/sync/copy-to-my-packages
 * Copy selected packages from packages table to my_packages table
 * Body: { packageIds: string[] }
 */
router.post('/copy-to-my-packages', asyncHandler(copyToMyPackages));

export default router; 