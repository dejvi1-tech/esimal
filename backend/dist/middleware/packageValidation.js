"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addValidationHeaders = exports.validatePackageBeforeCheckout = void 0;
exports.validatePackage = validatePackage;
exports.batchValidatePackages = batchValidatePackages;
exports.clearValidationCache = clearValidationCache;
exports.getValidationCacheStats = getValidationCacheStats;
const supabase_1 = require("../config/supabase");
const roamifyService_1 = require("../services/roamifyService");
const logger_1 = require("../utils/logger");
/**
 * Validate package before checkout
 */
const validatePackageBeforeCheckout = async (req, res, next) => {
    try {
        const { packageId } = req.body;
        if (!packageId) {
            res.status(400).json({
                error: 'Package ID is required',
                action: 'block'
            });
            return;
        }
        logger_1.logger.info(`🔍 Validating package before checkout: ${packageId}`);
        const validationResult = await validatePackage(packageId);
        // Add validation result to request object for use in subsequent middleware
        req.packageValidation = validationResult;
        switch (validationResult.action) {
            case 'proceed':
                logger_1.logger.info(`✅ Package validation passed: ${packageId}`);
                next();
                break;
            case 'warn':
                logger_1.logger.warn(`⚠️ Package validation warning: ${packageId}`, validationResult);
                // Continue but log the warning
                next();
                break;
            case 'block':
                logger_1.logger.error(`❌ Package validation failed: ${packageId}`, validationResult);
                res.status(400).json({
                    error: 'Package temporarily unavailable',
                    message: validationResult.message,
                    issues: validationResult.issues,
                    alternatives: validationResult.alternatives,
                    packageId: packageId
                });
                break;
            default:
                next();
        }
    }
    catch (error) {
        logger_1.logger.error('Error during package validation:', error);
        // Don't block checkout due to validation errors, just log and continue
        next();
    }
};
exports.validatePackageBeforeCheckout = validatePackageBeforeCheckout;
/**
 * Validate a single package
 */
async function validatePackage(packageId) {
    try {
        // 1. Get package data from database
        const packageData = await getPackageData(packageId);
        if (!packageData) {
            return {
                isValid: false,
                action: 'block',
                message: 'Package not found',
                issues: ['Package does not exist in database']
            };
        }
        // 2. Extract Roamify package ID
        const roamifyPackageId = extractRoamifyPackageId(packageData);
        if (!roamifyPackageId) {
            return {
                isValid: false,
                packageData,
                action: 'block',
                message: 'Package not configured for delivery',
                issues: ['No Roamify package ID found']
            };
        }
        // 3. Validate with Roamify API (with caching)
        const isValidInRoamify = await validateWithRoamify(roamifyPackageId);
        if (!isValidInRoamify) {
            // Get alternatives
            const alternatives = await getAlternativePackages(packageData);
            return {
                isValid: false,
                packageData,
                roamifyPackageId,
                action: alternatives.length > 0 ? 'warn' : 'block',
                message: alternatives.length > 0
                    ? 'Package temporarily unavailable, alternatives suggested'
                    : 'Package temporarily unavailable',
                issues: ['Roamify package ID is invalid or unavailable'],
                alternatives
            };
        }
        // 4. All validations passed
        return {
            isValid: true,
            packageData,
            roamifyPackageId,
            action: 'proceed',
            message: 'Package is valid and available'
        };
    }
    catch (error) {
        logger_1.logger.error('Error validating package:', error);
        return {
            isValid: false,
            action: 'warn', // Don't block due to validation errors
            message: 'Unable to validate package availability',
            issues: ['Validation system temporarily unavailable']
        };
    }
}
/**
 * Get package data from database
 */
async function getPackageData(packageId) {
    try {
        // Try my_packages table first
        const { data: myPackageData, error: myPackageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (!myPackageError && myPackageData) {
            return { ...myPackageData, source: 'my_packages' };
        }
        // Try by location_slug
        const { data: packageBySlug, error: slugError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('location_slug', packageId)
            .single();
        if (!slugError && packageBySlug) {
            return { ...packageBySlug, source: 'my_packages' };
        }
        // Try packages table
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (!packageError && packageData) {
            return { ...packageData, source: 'packages' };
        }
        return null;
    }
    catch (error) {
        logger_1.logger.error('Error fetching package data:', error);
        return null;
    }
}
/**
 * Extract Roamify package ID from package data
 */
function extractRoamifyPackageId(packageData) {
    // Check slug field first (preferred for Roamify V2)
    if (packageData.slug) {
        return packageData.slug;
    }
    // Check features.packageId (fallback)
    if (packageData.features && packageData.features.packageId) {
        return packageData.features.packageId;
    }
    // Check reseller_id (legacy fallback)
    if (packageData.reseller_id) {
        return packageData.reseller_id;
    }
    return null;
}
/**
 * Validate package ID with Roamify API (with caching)
 */
const roamifyValidationCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
async function validateWithRoamify(packageId) {
    try {
        // Check cache first
        const cached = roamifyValidationCache.get(packageId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            logger_1.logger.info(`📦 Using cached validation result for ${packageId}: ${cached.isValid}`);
            return cached.isValid;
        }
        // Validate with Roamify
        const isValid = await roamifyService_1.RoamifyService.validatePackageId(packageId);
        // Cache the result
        roamifyValidationCache.set(packageId, {
            isValid,
            timestamp: Date.now()
        });
        logger_1.logger.info(`📦 Roamify validation for ${packageId}: ${isValid}`);
        return isValid;
    }
    catch (error) {
        logger_1.logger.error(`Error validating package ${packageId} with Roamify:`, error);
        // Return true on error to avoid blocking orders
        return true;
    }
}
/**
 * Get alternative packages for a country/region
 */
async function getAlternativePackages(packageData) {
    try {
        const { data: alternatives, error } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('country_code', packageData.country_code)
            .eq('is_active', true)
            .neq('id', packageData.id)
            .limit(3);
        if (error || !alternatives) {
            return [];
        }
        // Filter alternatives that have valid Roamify package IDs
        const validAlternatives = [];
        for (const alt of alternatives) {
            const altRoamifyId = extractRoamifyPackageId(alt);
            if (altRoamifyId) {
                const isValid = await validateWithRoamify(altRoamifyId);
                if (isValid) {
                    validAlternatives.push({
                        id: alt.id,
                        name: alt.name,
                        price: alt.sale_price || alt.price,
                        data_amount: alt.data_amount,
                        days: alt.days,
                        country_name: alt.country_name
                    });
                }
            }
        }
        return validAlternatives;
    }
    catch (error) {
        logger_1.logger.error('Error getting alternative packages:', error);
        return [];
    }
}
/**
 * Batch validate multiple packages
 */
async function batchValidatePackages(packageIds) {
    const results = new Map();
    const validationPromises = packageIds.map(async (packageId) => {
        const result = await validatePackage(packageId);
        results.set(packageId, result);
    });
    await Promise.all(validationPromises);
    return results;
}
/**
 * Clear validation cache
 */
function clearValidationCache() {
    roamifyValidationCache.clear();
    logger_1.logger.info('🧹 Package validation cache cleared');
}
/**
 * Get validation cache stats
 */
function getValidationCacheStats() {
    return {
        size: roamifyValidationCache.size,
        keys: Array.from(roamifyValidationCache.keys())
    };
}
/**
 * Middleware to add validation results to response headers (for debugging)
 */
const addValidationHeaders = (req, res, next) => {
    const validation = req.packageValidation;
    if (validation) {
        res.setHeader('X-Package-Validation', validation.action);
        res.setHeader('X-Package-Valid', validation.isValid.toString());
        if (validation.issues) {
            res.setHeader('X-Package-Issues', validation.issues.join(', '));
        }
    }
    next();
};
exports.addValidationHeaders = addValidationHeaders;
//# sourceMappingURL=packageValidation.js.map