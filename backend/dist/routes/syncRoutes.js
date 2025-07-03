"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const syncController_1 = require("../controllers/syncController");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
// All sync routes require admin authentication
router.use(auth_1.requireAdminAuth);
/**
 * POST /api/sync/roamify-packages
 * Sync all packages from Roamify API to packages table
 */
router.post('/roamify-packages', (0, asyncHandler_1.asyncHandler)(syncController_1.syncRoamifyPackages));
/**
 * GET /api/sync/status
 * Get sync status and statistics
 */
router.get('/status', (0, asyncHandler_1.asyncHandler)(syncController_1.getSyncStatus));
/**
 * POST /api/sync/copy-to-my-packages
 * Copy selected packages from packages table to my_packages table
 * Body: { packageIds: string[] }
 */
router.post('/copy-to-my-packages', (0, asyncHandler_1.asyncHandler)(syncController_1.copyToMyPackages));
exports.default = router;
//# sourceMappingURL=syncRoutes.js.map