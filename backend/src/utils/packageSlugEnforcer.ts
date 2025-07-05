/**
 * Package Slug Enforcer - Ensures ALL packages follow standardized format
 * This is a comprehensive solution for 11,000+ packages
 */

import { createClient } from '@supabase/supabase-js';
import { generateStandardSlug, validatePackageSlug, PackageData } from './packageSlugValidator';

export interface PackageSlugEnforcerConfig {
  autoFix: boolean;
  validateOnCreate: boolean;
  validateOnUpdate: boolean;
  logViolations: boolean;
  enforceStrictFormat: boolean;
}

export class PackageSlugEnforcer {
  private supabase: any;
  private config: PackageSlugEnforcerConfig;

  constructor(supabaseClient: any, config: Partial<PackageSlugEnforcerConfig> = {}) {
    this.supabase = supabaseClient;
    this.config = {
      autoFix: true,
      validateOnCreate: true,
      validateOnUpdate: true,
      logViolations: true,
      enforceStrictFormat: true,
      ...config
    };
  }

  /**
   * Enforce slug format for a single package
   */
  async enforcePackageSlug(package: PackageData): Promise<{
    success: boolean;
    originalSlug?: string;
    newSlug?: string;
    fixed: boolean;
    errors: string[];
  }> {
    const result = {
      success: false,
      originalSlug: package.slug,
      newSlug: undefined as string | undefined,
      fixed: false,
      errors: [] as string[]
    };

    try {
      // Generate correct slug
      const correctSlug = generateStandardSlug(package);
      if (!correctSlug) {
        result.errors.push('Could not generate standard slug - missing required data');
        return result;
      }

      // Check if current slug is correct
      if (package.slug === correctSlug) {
        result.success = true;
        result.newSlug = correctSlug;
        return result;
      }

      // Auto-fix if enabled
      if (this.config.autoFix) {
        result.newSlug = correctSlug;
        result.fixed = true;
        result.success = true;
      } else {
        result.errors.push(`Slug format incorrect. Expected: ${correctSlug}`);
      }

    } catch (error) {
      result.errors.push(`Enforcement error: ${error}`);
    }

    return result;
  }

  /**
   * Enforce slugs for multiple packages (batch processing)
   */
  async enforceBatchSlugs(packages: PackageData[]): Promise<{
    total: number;
    fixed: number;
    errors: number;
    results: Array<{ package: PackageData; result: any }>;
  }> {
    const results = {
      total: packages.length,
      fixed: 0,
      errors: 0,
      results: [] as Array<{ package: PackageData; result: any }>
    };

    for (const package of packages) {
      const result = await this.enforcePackageSlug(package);
      results.results.push({ package, result });
      
      if (result.fixed) results.fixed++;
      if (result.errors.length > 0) results.errors++;
    }

    return results;
  }

  /**
   * Database trigger function to enforce slugs on INSERT
   */
  async enforceOnInsert(package: PackageData): Promise<PackageData> {
    if (!this.config.validateOnCreate) return package;

    const enforcement = await this.enforcePackageSlug(package);
    
    if (enforcement.fixed && enforcement.newSlug) {
      package.slug = enforcement.newSlug;
      
      if (this.config.logViolations) {
        console.log(`🔧 Auto-fixed slug for new package: ${package.name} -> ${enforcement.newSlug}`);
      }
    }

    return package;
  }

  /**
   * Database trigger function to enforce slugs on UPDATE
   */
  async enforceOnUpdate(package: PackageData): Promise<PackageData> {
    if (!this.config.validateOnUpdate) return package;

    const enforcement = await this.enforcePackageSlug(package);
    
    if (enforcement.fixed && enforcement.newSlug) {
      package.slug = enforcement.newSlug;
      
      if (this.config.logViolations) {
        console.log(`🔧 Auto-fixed slug for updated package: ${package.name} -> ${enforcement.newSlug}`);
      }
    }

    return package;
  }

  /**
   * Scan and fix all packages in database
   */
  async scanAndFixAllPackages(): Promise<{
    myPackages: any;
    packages: any;
    summary: any;
  }> {
    console.log('🔍 Scanning all packages for slug violations...');

    // Scan my_packages table
    const { data: myPackages, error: myPackagesError } = await this.supabase
      .from('my_packages')
      .select('*');

    if (myPackagesError) {
      throw new Error(`Error fetching my_packages: ${myPackagesError.message}`);
    }

    // Scan packages table
    const { data: packages, error: packagesError } = await this.supabase
      .from('packages')
      .select('*');

    if (packagesError) {
      throw new Error(`Error fetching packages: ${packagesError.message}`);
    }

    console.log(`📦 Found ${myPackages.length} packages in my_packages table`);
    console.log(`📦 Found ${packages.length} packages in packages table`);

    // Enforce slugs for my_packages
    const myPackagesResults = await this.enforceBatchSlugs(myPackages);
    
    // Enforce slugs for packages
    const packagesResults = await this.enforceBatchSlugs(packages);

    // Update database with fixes
    if (this.config.autoFix) {
      await this.updateDatabaseWithFixes(myPackages, packages);
    }

    return {
      myPackages: myPackagesResults,
      packages: packagesResults,
      summary: {
        totalPackages: myPackages.length + packages.length,
        totalFixed: myPackagesResults.fixed + packagesResults.fixed,
        totalErrors: myPackagesResults.errors + packagesResults.errors
      }
    };
  }

  /**
   * Update database with fixed slugs
   */
  private async updateDatabaseWithFixes(myPackages: PackageData[], packages: PackageData[]): Promise<void> {
    console.log('💾 Updating database with fixed slugs...');

    // Update my_packages table
    for (const package of myPackages) {
      const correctSlug = generateStandardSlug(package);
      if (correctSlug && package.slug !== correctSlug) {
        await this.supabase
          .from('my_packages')
          .update({ slug: correctSlug })
          .eq('id', package.id);
      }
    }

    // Update packages table
    for (const package of packages) {
      const correctSlug = generateStandardSlug(package);
      if (correctSlug && package.slug !== correctSlug) {
        await this.supabase
          .from('packages')
          .update({ slug: correctSlug })
          .eq('id', package.id);
      }
    }

    console.log('✅ Database updated successfully');
  }

  /**
   * Create database triggers for automatic enforcement
   */
  async createDatabaseTriggers(): Promise<void> {
    console.log('🔧 Creating database triggers for automatic slug enforcement...');

    // This would create PostgreSQL triggers to automatically enforce slugs
    // Implementation depends on your database setup
    console.log('⚠️ Database triggers need to be implemented based on your specific database setup');
  }

  /**
   * Validate all packages and return detailed report
   */
  async validateAllPackages(): Promise<{
    valid: PackageData[];
    invalid: Array<{ package: PackageData; validation: any }>;
    summary: any;
  }> {
    console.log('🔍 Validating all packages...');

    const { data: allPackages, error } = await this.supabase
      .from('my_packages')
      .select('*');

    if (error) throw new Error(`Error fetching packages: ${error.message}`);

    const valid: PackageData[] = [];
    const invalid: Array<{ package: PackageData; validation: any }> = [];

    for (const package of allPackages) {
      const validation = validatePackageSlug(package);
      if (validation.isValid) {
        valid.push(package);
      } else {
        invalid.push({ package, validation });
      }
    }

    return {
      valid,
      invalid,
      summary: {
        total: allPackages.length,
        valid: valid.length,
        invalid: invalid.length,
        percentageValid: (valid.length / allPackages.length) * 100
      }
    };
  }
}

// Export singleton instance
export const packageSlugEnforcer = new PackageSlugEnforcer(null, {
  autoFix: true,
  validateOnCreate: true,
  validateOnUpdate: true,
  logViolations: true,
  enforceStrictFormat: true
}); 