"use strict";
/**
 * Package Slug Enforcer - Ensures ALL packages follow standardized format
 * This is a comprehensive solution for 11,000+ packages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageSlugEnforcer = exports.PackageSlugEnforcer = void 0;
const packageSlugValidator_1 = require("./packageSlugValidator");
class PackageSlugEnforcer {
    constructor(supabaseClient, config = {}) {
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
    async enforcePackageSlug(package) {
        const result = {
            success: false,
            originalSlug: package.slug,
            newSlug: undefined,
            fixed: false,
            errors: []
        };
        try {
            // Generate correct slug
            const correctSlug = (0, packageSlugValidator_1.generateStandardSlug)(package);
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
            }
            else {
                result.errors.push(`Slug format incorrect. Expected: ${correctSlug}`);
            }
        }
        catch (error) {
            result.errors.push(`Enforcement error: ${error}`);
        }
        return result;
    }
    /**
     * Enforce slugs for multiple packages (batch processing)
     */
    async enforceBatchSlugs(packages) {
        const results = {
            total: packages.length,
            fixed: 0,
            errors: 0,
            results: []
        };
        for (const package of packages) {
            const result = await this.enforcePackageSlug(package);
            results.results.push({ package, result });
            if (result.fixed)
                results.fixed++;
            if (result.errors.length > 0)
                results.errors++;
        }
        return results;
    }
    /**
     * Database trigger function to enforce slugs on INSERT
     */
    async enforceOnInsert(package) {
        if (!this.config.validateOnCreate)
            return package;
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
    async enforceOnUpdate(package) {
        if (!this.config.validateOnUpdate)
            return package;
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
    async scanAndFixAllPackages() {
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
    async updateDatabaseWithFixes(myPackages, packages) {
        console.log('💾 Updating database with fixed slugs...');
        // Update my_packages table
        for (const package of myPackages) {
            const correctSlug = (0, packageSlugValidator_1.generateStandardSlug)(package);
            if (correctSlug && package.slug !== correctSlug) {
                await this.supabase
                    .from('my_packages')
                    .update({ slug: correctSlug })
                    .eq('id', package.id);
            }
        }
        // Update packages table
        for (const package of packages) {
            const correctSlug = (0, packageSlugValidator_1.generateStandardSlug)(package);
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
    async createDatabaseTriggers() {
        console.log('🔧 Creating database triggers for automatic slug enforcement...');
        // This would create PostgreSQL triggers to automatically enforce slugs
        // Implementation depends on your database setup
        console.log('⚠️ Database triggers need to be implemented based on your specific database setup');
    }
    /**
     * Validate all packages and return detailed report
     */
    async validateAllPackages() {
        console.log('🔍 Validating all packages...');
        const { data: allPackages, error } = await this.supabase
            .from('my_packages')
            .select('*');
        if (error)
            throw new Error(`Error fetching packages: ${error.message}`);
        const valid = [];
        const invalid = [];
        for (const package of allPackages) {
            const validation = (0, packageSlugValidator_1.validatePackageSlug)(package);
            if (validation.isValid) {
                valid.push(package);
            }
            else {
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
exports.PackageSlugEnforcer = PackageSlugEnforcer;
// Export singleton instance
exports.packageSlugEnforcer = new PackageSlugEnforcer(null, {
    autoFix: true,
    validateOnCreate: true,
    validateOnUpdate: true,
    logViolations: true,
    enforceStrictFormat: true
});
//# sourceMappingURL=packageSlugEnforcer.js.map