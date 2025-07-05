/**
 * Package Slug Middleware - Automatically enforces correct slug format
 * This middleware runs on all package operations to prevent future issues
 */

import { Request, Response, NextFunction } from 'express';
import { PackageSlugEnforcer } from '../utils/packageSlugEnforcer';
import { generateStandardSlug, validatePackageSlug } from '../utils/packageSlugValidator';

export interface PackageSlugMiddlewareConfig {
  enforceOnCreate: boolean;
  enforceOnUpdate: boolean;
  enforceOnSync: boolean;
  autoFix: boolean;
  logViolations: boolean;
}

export class PackageSlugMiddleware {
  private enforcer: PackageSlugEnforcer;
  private config: PackageSlugMiddlewareConfig;

  constructor(supabaseClient: any, config: Partial<PackageSlugMiddlewareConfig> = {}) {
    this.enforcer = new PackageSlugEnforcer(supabaseClient, {
      autoFix: true,
      validateOnCreate: true,
      validateOnUpdate: true,
      logViolations: true,
      enforceStrictFormat: true
    });

    this.config = {
      enforceOnCreate: true,
      enforceOnUpdate: true,
      enforceOnSync: true,
      autoFix: true,
      logViolations: true,
      ...config
    };
  }

  /**
   * Middleware for package creation operations
   */
  enforceOnCreate = async (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.enforceOnCreate) {
      return next();
    }

    try {
      const packageData = req.body;
      
      // Enforce slug format
      const enforcedPackage = await this.enforcer.enforceOnInsert(packageData);
      
      // Update request body with enforced data
      req.body = enforcedPackage;
      
      if (this.config.logViolations && packageData.slug !== enforcedPackage.slug) {
        console.log(`🔧 Middleware: Fixed slug for new package ${packageData.name}: ${packageData.slug} -> ${enforcedPackage.slug}`);
      }
      
      next();
    } catch (error) {
      console.error('❌ Package slug middleware error:', error);
      next(error);
    }
  };

  /**
   * Middleware for package update operations
   */
  enforceOnUpdate = async (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.enforceOnUpdate) {
      return next();
    }

    try {
      const packageData = req.body;
      
      // Enforce slug format
      const enforcedPackage = await this.enforcer.enforceOnUpdate(packageData);
      
      // Update request body with enforced data
      req.body = enforcedPackage;
      
      if (this.config.logViolations && packageData.slug !== enforcedPackage.slug) {
        console.log(`🔧 Middleware: Fixed slug for updated package ${packageData.name}: ${packageData.slug} -> ${enforcedPackage.slug}`);
      }
      
      next();
    } catch (error) {
      console.error('❌ Package slug middleware error:', error);
      next(error);
    }
  };

  /**
   * Middleware for package sync operations
   */
  enforceOnSync = async (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.enforceOnSync) {
      return next();
    }

    try {
      const packages = req.body.packages || req.body;
      
      if (Array.isArray(packages)) {
        // Process multiple packages
        const enforcedPackages = [];
        for (const package of packages) {
          const enforcedPackage = await this.enforcer.enforceOnInsert(package);
          enforcedPackages.push(enforcedPackage);
        }
        req.body.packages = enforcedPackages;
      } else {
        // Process single package
        const enforcedPackage = await this.enforcer.enforceOnInsert(packages);
        req.body = enforcedPackage;
      }
      
      next();
    } catch (error) {
      console.error('❌ Package sync middleware error:', error);
      next(error);
    }
  };

  /**
   * Validation middleware - checks if package has correct slug
   */
  validatePackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const packageData = req.body;
      
      if (!packageData.slug) {
        // Generate slug if missing
        const generatedSlug = generateStandardSlug(packageData);
        if (generatedSlug) {
          packageData.slug = generatedSlug;
          req.body = packageData;
          console.log(`🔧 Generated missing slug for package ${packageData.name}: ${generatedSlug}`);
        } else {
          return res.status(400).json({
            error: 'Invalid package data - cannot generate slug',
            details: 'Package must have country_name, data_amount, and days fields'
          });
        }
      } else {
        // Validate existing slug
        const validation = validatePackageSlug(packageData);
        if (!validation.isValid) {
          if (this.config.autoFix && validation.suggestedSlug) {
            packageData.slug = validation.suggestedSlug;
            req.body = packageData;
            console.log(`🔧 Auto-fixed invalid slug for package ${packageData.name}: ${validation.suggestedSlug}`);
          } else {
            return res.status(400).json({
              error: 'Invalid package slug format',
              details: validation.errors,
              suggestedSlug: validation.suggestedSlug
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('❌ Package validation middleware error:', error);
      next(error);
    }
  };
}

// Export middleware functions
export const createPackageSlugMiddleware = (supabaseClient: any, config?: Partial<PackageSlugMiddlewareConfig>) => {
  const middleware = new PackageSlugMiddleware(supabaseClient, config);
  
  return {
    enforceOnCreate: middleware.enforceOnCreate,
    enforceOnUpdate: middleware.enforceOnUpdate,
    enforceOnSync: middleware.enforceOnSync,
    validatePackage: middleware.validatePackage
  };
}; 