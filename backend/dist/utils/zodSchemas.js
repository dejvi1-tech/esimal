"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePackageSchema = exports.cancelOrderSchema = exports.updateOrderStatusSchema = exports.updatePackageSchema = exports.createPackageSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
// Order creation schema (POST /api/orders)
exports.createOrderSchema = zod_1.z.object({
    packageId: zod_1.z.string().min(1),
    userEmail: zod_1.z.string().email(),
    userName: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    country_code: zod_1.z.string().length(2),
    name: zod_1.z.string().optional(), // for my-packages
    surname: zod_1.z.string().optional(), // for my-packages
});
// Package creation schema (POST /api/packages)
exports.createPackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    dataAmount: zod_1.z.number().positive(),
    days: zod_1.z.number().positive(),
    country: zod_1.z.string().min(1),
    operator: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
});
// Package update schema (PUT /api/packages/:id)
exports.updatePackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
    dataAmount: zod_1.z.number().positive().optional(),
    days: zod_1.z.number().positive().optional(),
    country: zod_1.z.string().min(1).optional(),
    operator: zod_1.z.string().min(1).optional(),
    type: zod_1.z.string().min(1).optional(),
    validity: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
});
// Order status update schema (PUT /api/orders/:id/status)
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional(),
});
// Order cancel schema (POST /api/orders/:id/cancel)
exports.cancelOrderSchema = zod_1.z.object({}); // No body expected, but keep for extensibility
// Save package schema (POST /api/admin/save-package)
exports.savePackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    country_name: zod_1.z.string().min(1),
    country_code: zod_1.z.string().length(2),
    data_amount: zod_1.z.number().positive(),
    days: zod_1.z.number().positive(),
    base_price: zod_1.z.number().positive(),
    sale_price: zod_1.z.number().positive().optional(),
    profit: zod_1.z.number().optional(),
    reseller_id: zod_1.z.string().optional().nullable(),
    region: zod_1.z.string().optional(),
    visible: zod_1.z.boolean().optional(),
    show_on_frontend: zod_1.z.boolean().optional(),
    location_slug: zod_1.z.string().optional(),
    homepage_order: zod_1.z.number().optional(),
    features: zod_1.z.record(zod_1.z.any()).optional(),
});
//# sourceMappingURL=zodSchemas.js.map