"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFindGermanyPackages = exports.findGermanyPackagesSchema = exports.validateFixInvalidIds = exports.fixInvalidIdsSchema = exports.validateCompleteSync = exports.completeSyncSchema = exports.validateFixSpecificFailingPackage = exports.fixSpecificFailingPackageSchema = exports.validateFixRoamifyConfig = exports.fixRoamifyConfigSchema = exports.validateDeduplicateMyPackages = exports.deduplicateMyPackagesSchema = exports.validatePackagesSync = exports.packagesSyncSchema = exports.validatePackagesValidate = exports.packagesValidateSchema = exports.validateSyncRoamifyPackages = exports.syncRoamifyPackagesSchema = exports.validateDeduplicatePackages = exports.deduplicatePackagesSchema = void 0;
const zod_1 = require("zod");
// 1. POST /deduplicate-packages → { type: 'slug' | 'uuid' }
exports.deduplicatePackagesSchema = zod_1.z.object({
    type: zod_1.z.enum(['slug', 'uuid'])
});
/**
 * Middleware to validate deduplicate packages request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateDeduplicatePackages = (req, res, next) => {
    const result = exports.deduplicatePackagesSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateDeduplicatePackages = validateDeduplicatePackages;
// 2. POST /sync-roamify-packages → empty body
exports.syncRoamifyPackagesSchema = zod_1.z.object({});
/**
 * Middleware to validate sync roamify packages request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateSyncRoamifyPackages = (req, res, next) => {
    const result = exports.syncRoamifyPackagesSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateSyncRoamifyPackages = validateSyncRoamifyPackages;
// 3. POST /packages/validate → { packageIds?: string[], limit?: number }
exports.packagesValidateSchema = zod_1.z.object({
    packageIds: zod_1.z.array(zod_1.z.string()).optional(),
    limit: zod_1.z.number().optional()
});
/**
 * Middleware to validate packages validate request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validatePackagesValidate = (req, res, next) => {
    const result = exports.packagesValidateSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validatePackagesValidate = validatePackagesValidate;
// 4. POST /packages/sync → { options?: object }
exports.packagesSyncSchema = zod_1.z.object({
    options: zod_1.z.record(zod_1.z.any()).optional()
});
/**
 * Middleware to validate packages sync request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validatePackagesSync = (req, res, next) => {
    const result = exports.packagesSyncSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validatePackagesSync = validatePackagesSync;
// 5. POST /packages/deduplicate-my-packages → empty body
exports.deduplicateMyPackagesSchema = zod_1.z.object({});
/**
 * Middleware to validate deduplicate my packages request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateDeduplicateMyPackages = (req, res, next) => {
    const result = exports.deduplicateMyPackagesSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateDeduplicateMyPackages = validateDeduplicateMyPackages;
// 6. POST /packages/fix-roamify-config → { fixCountryCodes?: boolean }
exports.fixRoamifyConfigSchema = zod_1.z.object({
    fixCountryCodes: zod_1.z.boolean().optional()
});
/**
 * Middleware to validate fix roamify config request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateFixRoamifyConfig = (req, res, next) => {
    const result = exports.fixRoamifyConfigSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateFixRoamifyConfig = validateFixRoamifyConfig;
// 7. POST /packages/fix-specific-failing-package → { slug: string }
exports.fixSpecificFailingPackageSchema = zod_1.z.object({
    slug: zod_1.z.string()
});
/**
 * Middleware to validate fix specific failing package request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateFixSpecificFailingPackage = (req, res, next) => {
    const result = exports.fixSpecificFailingPackageSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateFixSpecificFailingPackage = validateFixSpecificFailingPackage;
// 8. POST /packages/complete-sync → empty body
exports.completeSyncSchema = zod_1.z.object({});
/**
 * Middleware to validate complete sync request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateCompleteSync = (req, res, next) => {
    const result = exports.completeSyncSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateCompleteSync = validateCompleteSync;
// 9. POST /packages/fix-invalid-ids → empty body
exports.fixInvalidIdsSchema = zod_1.z.object({});
/**
 * Middleware to validate fix invalid ids request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateFixInvalidIds = (req, res, next) => {
    const result = exports.fixInvalidIdsSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateFixInvalidIds = validateFixInvalidIds;
// 10. POST /packages/find-germany-packages → empty body
exports.findGermanyPackagesSchema = zod_1.z.object({});
/**
 * Middleware to validate find Germany packages request body.
 *
 * Args:
 *     req (Request): Express request object.
 *     res (Response): Express response object.
 *     next (NextFunction): Express next middleware function.
 *
 * Returns:
 *     void
 */
const validateFindGermanyPackages = (req, res, next) => {
    const result = exports.findGermanyPackagesSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
        return;
    }
    next();
};
exports.validateFindGermanyPackages = validateFindGermanyPackages;
//# sourceMappingURL=adminValidation.js.map