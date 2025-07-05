"use strict";
/**
 * Package Slug Validator and Generator
 * Ensures all packages follow the standardized format: esim-{country}-{days}days-{data}gb-all
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStandardSlug = generateStandardSlug;
exports.validatePackageSlug = validatePackageSlug;
exports.validatePackages = validatePackages;
exports.generateStandardSlugs = generateStandardSlugs;
exports.isLikelyRoamifyCompatible = isLikelyRoamifyCompatible;
exports.getSlugExamples = getSlugExamples;
/**
 * Generate a standardized slug for a package
 * Format: esim-{country}-{days}days-{data}gb-all
 */
function generateStandardSlug(pkg) {
    try {
        // Normalize country name
        const country = pkg.country_name?.toLowerCase().replace(/\s+/g, '-');
        // Get days (default to 30 if not specified)
        const days = pkg.days || 30;
        // Normalize data amount
        const dataAmount = pkg.data_amount?.toString().replace(/\s+/g, '').toLowerCase();
        // Validation
        if (!country) {
            throw new Error('Country name is required');
        }
        if (!dataAmount) {
            throw new Error('Data amount is required');
        }
        if (days <= 0) {
            throw new Error('Days must be greater than 0');
        }
        return `esim-${country}-${days}days-${dataAmount}gb-all`;
    }
    catch (error) {
        console.error('Error generating standard slug:', error);
        return null;
    }
}
/**
 * Validate if a package slug follows the standard format
 */
function validatePackageSlug(pkg) {
    const result = {
        isValid: false,
        errors: [],
        warnings: []
    };
    // Check if slug exists
    if (!pkg.slug) {
        result.errors.push('Package slug is missing');
        result.suggestedSlug = generateStandardSlug(pkg);
        return result;
    }
    result.currentSlug = pkg.slug;
    // Check if slug follows standard format
    const standardSlug = generateStandardSlug(pkg);
    if (!standardSlug) {
        result.errors.push('Could not generate standard slug (missing required data)');
        return result;
    }
    result.suggestedSlug = standardSlug;
    // Check if current slug matches standard format
    if (pkg.slug !== standardSlug) {
        result.errors.push(`Slug format is incorrect. Expected: ${standardSlug}`);
        result.warnings.push('Slug should follow the standard format for Roamify API compatibility');
    }
    // Additional validation checks
    if (!pkg.slug.startsWith('esim-')) {
        result.errors.push('Slug must start with "esim-"');
    }
    if (!pkg.slug.includes('-days-')) {
        result.errors.push('Slug must include "-days-" format');
    }
    if (!pkg.slug.includes('-gb-all')) {
        result.errors.push('Slug must end with "-gb-all"');
    }
    // Check for common issues
    if (pkg.slug.includes(' ')) {
        result.errors.push('Slug contains spaces (should use hyphens)');
    }
    if (pkg.slug !== pkg.slug.toLowerCase()) {
        result.warnings.push('Slug should be lowercase');
    }
    // If no errors, slug is valid
    if (result.errors.length === 0) {
        result.isValid = true;
    }
    return result;
}
/**
 * Validate multiple packages and return summary
 */
function validatePackages(packages) {
    const valid = [];
    const invalid = [];
    let missingSlugs = 0;
    let incorrectFormat = 0;
    for (const pkg of packages) {
        const validation = validatePackageSlug(pkg);
        if (validation.isValid) {
            valid.push(pkg);
        }
        else {
            invalid.push({ pkg, validation });
            if (!pkg.slug) {
                missingSlugs++;
            }
            else {
                incorrectFormat++;
            }
        }
    }
    return {
        valid,
        invalid,
        summary: {
            total: packages.length,
            valid: valid.length,
            invalid: invalid.length,
            missingSlugs,
            incorrectFormat
        }
    };
}
/**
 * Generate standardized slugs for multiple packages
 */
function generateStandardSlugs(packages) {
    return packages.map(pkg => {
        const currentSlug = pkg.slug;
        const newSlug = generateStandardSlug(pkg);
        const needsUpdate = !currentSlug || currentSlug !== newSlug;
        return {
            pkg,
            currentSlug,
            newSlug,
            needsUpdate
        };
    });
}
/**
 * Check if a slug is likely to work with Roamify API
 * (Basic format validation without actual API call)
 */
function isLikelyRoamifyCompatible(slug) {
    if (!slug)
        return false;
    // Must start with esim-
    if (!slug.startsWith('esim-'))
        return false;
    // Must contain -days- and -gb-all
    if (!slug.includes('-days-'))
        return false;
    if (!slug.includes('-gb-all'))
        return false;
    // Must be lowercase
    if (slug !== slug.toLowerCase())
        return false;
    // Must not contain spaces
    if (slug.includes(' '))
        return false;
    return true;
}
/**
 * Get examples of correct slug formats for different countries
 */
function getSlugExamples() {
    return {
        'Greece': 'esim-greece-30days-1gb-all',
        'Albania': 'esim-albania-30days-3gb-all',
        'Germany': 'esim-germany-15days-5gb-all',
        'Italy': 'esim-italy-7days-2gb-all',
        'France': 'esim-france-30days-10gb-all',
        'Spain': 'esim-spain-15days-3gb-all',
        'United States': 'esim-united-states-30days-20gb-all',
        'United Kingdom': 'esim-united-kingdom-30days-15gb-all'
    };
}
//# sourceMappingURL=packageSlugValidator.js.map