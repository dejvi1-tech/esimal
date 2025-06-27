"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../controllers/accountController");
const router = express_1.default.Router();
// Admin-only routes for user management
router.get('/users', accountController_1.getAllUsers);
router.get('/users/:id', accountController_1.getUserById);
router.get('/users/:id/transactions', accountController_1.getUserTransactions);
// Get account balance from Roamify
router.get('/balance-roamify', accountController_1.getAccountBalanceFromRoamify);
exports.default = router;
//# sourceMappingURL=accountRoutes.js.map