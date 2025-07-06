import express from 'express';
import { 
  getAllEsims,
  getEsimByIccid,
  getEsimUsageDetails,
  updateEsimStatus,
  getEsimUsageStats,
  getEsimsByUserId,
  getAccountBalanceFromRoamify,
  getEsimUsageByIccid
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

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'eSIM routes working', timestamp: new Date().toISOString() });
});

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase');
    const { data, error } = await supabase
      .from('orders')
      .select('id, iccid')
      .limit(5);
    
    if (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: error.message 
      });
    } else {
      res.json({ 
        status: 'success', 
        message: 'Database connection working', 
        orderCount: data?.length || 0,
        sampleData: data 
      });
    }
  } catch (err: any) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database test failed', 
      error: err.message 
    });
  }
});

// Public endpoint for balance check
router.get('/usage/:iccid', getEsimUsageByIccid);

export default router; 