"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Authentication routes removed - no longer needed
router.get('/health', (req, res) => {
    res.json({ message: 'Auth routes disabled - authentication removed' });
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map