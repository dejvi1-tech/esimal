import express from 'express';
import { 
  getAllEsims,
  getEsimByIccid,
  getEsimUsageDetails,
  updateEsimStatus,
  getEsimUsageStats,
  getEsimsByUserId,
  getAccountBalanceFromRoamify
} from '../controllers/esimController';

const router = express.Router();

// Admin-only routes for eSIM management
router.get('/', getAllEsims);
router.get('/stats', getEsimUsageStats);
router.get('/user/:userId', getEsimsByUserId);
router.get('/iccid/:iccid', getEsimByIccid);
router.get('/iccid/:iccid/usage', getEsimUsageDetails);
router.put('/iccid/:iccid/status', updateEsimStatus);

// Get account balance from Roamify
router.get('/balance-roamify', getAccountBalanceFromRoamify);

export default router; 