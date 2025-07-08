"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduledJobController_1 = require("../controllers/scheduledJobController");
const router = express_1.default.Router();
// Health check for scheduled jobs
router.get('/health', scheduledJobController_1.scheduledJobsHealth);
// Manual trigger for usage alerts (protected by API key)
router.post('/usage-alerts/trigger', scheduledJobController_1.triggerUsageAlerts);
exports.default = router;
//# sourceMappingURL=scheduledJobRoutes.js.map