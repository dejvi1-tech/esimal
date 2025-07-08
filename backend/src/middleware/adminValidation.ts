import { z } from 'zod';
import { RequestHandler } from 'express';

// 1. POST /deduplicate-packages → { type: 'slug' | 'uuid' }
export const deduplicatePackagesSchema = z.object({
  type: z.enum(['slug', 'uuid'])
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
export const validateDeduplicatePackages: RequestHandler = (req, res, next) => {
  const result = deduplicatePackagesSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 2. POST /sync-roamify-packages → empty body
export const syncRoamifyPackagesSchema = z.object({});
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
export const validateSyncRoamifyPackages: RequestHandler = (req, res, next) => {
  const result = syncRoamifyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 3. POST /packages/validate → { packageIds?: string[], limit?: number }
export const packagesValidateSchema = z.object({
  packageIds: z.array(z.string()).optional(),
  limit: z.number().optional()
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
export const validatePackagesValidate: RequestHandler = (req, res, next) => {
  const result = packagesValidateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 4. POST /packages/sync → { options?: object }
export const packagesSyncSchema = z.object({
  options: z.record(z.any()).optional()
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
export const validatePackagesSync: RequestHandler = (req, res, next) => {
  const result = packagesSyncSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 5. POST /packages/deduplicate-my-packages → empty body
export const deduplicateMyPackagesSchema = z.object({});
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
export const validateDeduplicateMyPackages: RequestHandler = (req, res, next) => {
  const result = deduplicateMyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 6. POST /packages/fix-roamify-config → { fixCountryCodes?: boolean }
export const fixRoamifyConfigSchema = z.object({
  fixCountryCodes: z.boolean().optional()
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
export const validateFixRoamifyConfig: RequestHandler = (req, res, next) => {
  const result = fixRoamifyConfigSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 7. POST /packages/fix-specific-failing-package → { slug: string }
export const fixSpecificFailingPackageSchema = z.object({
  slug: z.string()
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
export const validateFixSpecificFailingPackage: RequestHandler = (req, res, next) => {
  const result = fixSpecificFailingPackageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 8. POST /packages/complete-sync → empty body
export const completeSyncSchema = z.object({});
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
export const validateCompleteSync: RequestHandler = (req, res, next) => {
  const result = completeSyncSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 9. POST /packages/fix-invalid-ids → empty body
export const fixInvalidIdsSchema = z.object({});
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
export const validateFixInvalidIds: RequestHandler = (req, res, next) => {
  const result = fixInvalidIdsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
};

// 10. POST /packages/find-germany-packages → empty body
export const findGermanyPackagesSchema = z.object({});
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
export const validateFindGermanyPackages: RequestHandler = (req, res, next) => {
  const result = findGermanyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
    return;
  }
  next();
}; 