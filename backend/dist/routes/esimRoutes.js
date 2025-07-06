"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const esimController_1 = require("../controllers/esimController");
const router = express_1.default.Router();
// Admin-only routes for eSIM management
router.get('/', esimController_1.getAllEsims);
router.get('/stats', esimController_1.getEsimUsageStats);
router.get('/user/:userId', esimController_1.getEsimsByUserId);
router.get('/iccid/:iccid', esimController_1.getEsimByIccid);
router.get('/iccid/:iccid/usage', esimController_1.getEsimUsageDetails);
router.put('/iccid/:iccid/status', esimController_1.updateEsimStatus);
// Get account balance from Roamify
router.get('/balance-roamify', esimController_1.getAccountBalanceFromRoamify);
// Public endpoint for balance check
router.get('/usage/:iccid', esimController_1.getEsimUsageByIccid);
exports.default = router;
//# sourceMappingURL=esimRoutes.js.map