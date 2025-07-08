import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// 1. POST /deduplicate-packages → { type: 'slug' | 'uuid' }
export const deduplicatePackagesSchema = z.object({
  type: z.enum(['slug', 'uuid'])
});
export function validateDeduplicatePackages(req: Request, res: Response, next: NextFunction) {
  const result = deduplicatePackagesSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 2. POST /sync-roamify-packages → empty body
export const syncRoamifyPackagesSchema = z.object({});
export function validateSyncRoamifyPackages(req: Request, res: Response, next: NextFunction) {
  const result = syncRoamifyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 3. POST /packages/validate → { packageIds?: string[], limit?: number }
export const packagesValidateSchema = z.object({
  packageIds: z.array(z.string()).optional(),
  limit: z.number().optional()
});
export function validatePackagesValidate(req: Request, res: Response, next: NextFunction) {
  const result = packagesValidateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 4. POST /packages/sync → { options?: object }
export const packagesSyncSchema = z.object({
  options: z.record(z.any()).optional()
});
export function validatePackagesSync(req: Request, res: Response, next: NextFunction) {
  const result = packagesSyncSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 5. POST /packages/deduplicate-my-packages → empty body
export const deduplicateMyPackagesSchema = z.object({});
export function validateDeduplicateMyPackages(req: Request, res: Response, next: NextFunction) {
  const result = deduplicateMyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 6. POST /packages/fix-roamify-config → { fixCountryCodes?: boolean }
export const fixRoamifyConfigSchema = z.object({
  fixCountryCodes: z.boolean().optional()
});
export function validateFixRoamifyConfig(req: Request, res: Response, next: NextFunction) {
  const result = fixRoamifyConfigSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 7. POST /packages/fix-specific-failing-package → { slug: string }
export const fixSpecificFailingPackageSchema = z.object({
  slug: z.string()
});
export function validateFixSpecificFailingPackage(req: Request, res: Response, next: NextFunction) {
  const result = fixSpecificFailingPackageSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 8. POST /packages/complete-sync → empty body
export const completeSyncSchema = z.object({});
export function validateCompleteSync(req: Request, res: Response, next: NextFunction) {
  const result = completeSyncSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 9. POST /packages/fix-invalid-ids → empty body
export const fixInvalidIdsSchema = z.object({});
export function validateFixInvalidIds(req: Request, res: Response, next: NextFunction) {
  const result = fixInvalidIdsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
}

// 10. POST /packages/find-germany-packages → empty body
export const findGermanyPackagesSchema = z.object({});
export function validateFindGermanyPackages(req: Request, res: Response, next: NextFunction) {
  const result = findGermanyPackagesSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request body', details: result.error.errors });
  }
  next();
} 