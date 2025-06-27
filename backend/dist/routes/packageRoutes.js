"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const packageController_1 = require("../controllers/packageController");
const router = express_1.default.Router();
// Admin-only routes for package management
router.get('/', packageController_1.getAllPackages);
router.post('/', packageController_1.createPackage);
router.get('/:id', packageController_1.getPackage);
router.put('/:id', packageController_1.updatePackage);
router.delete('/:id', packageController_1.deletePackage);
exports.default = router;
//# sourceMappingURL=packageRoutes.js.map