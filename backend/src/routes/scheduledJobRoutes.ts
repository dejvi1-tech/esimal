import express from 'express';
import { triggerUsageAlerts, scheduledJobsHealth } from '../controllers/scheduledJobController';

const router = express.Router();

// Health check for scheduled jobs
router.get('/health', scheduledJobsHealth);

// Manual trigger for usage alerts (protected by API key)
router.post('/usage-alerts/trigger', triggerUsageAlerts);

export default router; 