"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledJobsHealth = exports.triggerUsageAlerts = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const usageAlertService_1 = require("../services/usageAlertService");
const logger_1 = require("../utils/logger");
/**
 * Manual trigger for usage alerts (for testing or immediate execution)
 */
exports.triggerUsageAlerts = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        logger_1.logger.info('🔔 Manual usage alert trigger requested');
        await usageAlertService_1.UsageAlertService.checkAndSendUsageAlerts();
        res.status(200).json({
            status: 'success',
            message: 'Usage alerts check completed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error in manual usage alert trigger:', error);
        next(error);
    }
});
/**
 * Health check for scheduled jobs
 */
exports.scheduledJobsHealth = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        message: 'Scheduled jobs service is healthy',
        timestamp: new Date().toISOString(),
        services: {
            usageAlerts: 'available'
        }
    });
});
//# sourceMappingURL=scheduledJobController.js.map