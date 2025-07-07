import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UsageAlertService } from '../services/usageAlertService';
import { logger } from '../utils/logger';

/**
 * Manual trigger for usage alerts (for testing or immediate execution)
 */
export const triggerUsageAlerts = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('🔔 Manual usage alert trigger requested');
    
    await UsageAlertService.checkAndSendUsageAlerts();
    
    res.status(200).json({
      status: 'success',
      message: 'Usage alerts check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in manual usage alert trigger:', error);
    next(error);
  }
});

/**
 * Health check for scheduled jobs
 */
export const scheduledJobsHealth = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({
    status: 'success',
    message: 'Scheduled jobs service is healthy',
    timestamp: new Date().toISOString(),
    services: {
      usageAlerts: 'available'
    }
  });
}); 