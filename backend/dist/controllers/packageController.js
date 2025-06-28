"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduplicatePackages = exports.getPackageCountries = exports.getAllRoamifyPackages = exports.getMyPackages = exports.searchPackages = exports.getSectionPackages = exports.getCountries = exports.deletePackage = exports.updatePackage = exports.getPackage = exports.getAllPackages = exports.createPackage = void 0;
const supabase_1 = require("../config/supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const errors_1 = require("../utils/errors");
console.log('updatePackage controller loaded');
// Create admin client for bypassing RLS
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Admin-only function to create package
const createPackage = async (req, res, next) => {
    try {
        const { name, description, price, dataAmount, validityDays, country, operator, type, } = req.body;
        // Validate required fields
        if (!name || !price || !dataAmount || !validityDays || !country || !operator || !type) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.required('All package fields'));
        }
        if (price <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Price'));
        }
        if (dataAmount <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Data amount'));
        }
        if (validityDays <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Validity days'));
        }
        // Check if package with same name exists
        const { data: existingPackage } = await supabase_1.supabase
            .from('packages')
            .select('id')
            .eq('name', name)
            .single();
        if (existingPackage) {
            throw new errors_1.ConflictError(errors_1.ErrorMessages.package.nameExists);
        }
        // Create package
        const { data: newPackage, error } = await supabase_1.supabase
            .from('packages')
            .insert([
            {
                name,
                description,
                price,
                data_amount: dataAmount,
                validity_days: validityDays,
                country,
                operator,
                type,
            },
        ])
            .select()
            .single();
        if (error) {
            throw error;
        }
        res.status(201).json({
            status: 'success',
            data: newPackage,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPackage = createPackage;
// Admin-only function to get all packages
const getAllPackages = async (req, res, next) => {
    try {
        const { data: packages, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        res.status(200).json({
            status: 'success',
            data: packages,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPackages = getAllPackages;
// Admin-only function to get package by ID
const getPackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data: pkg, error } = await supabase_1.supabase
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            throw error;
        }
        if (!pkg) {
            throw new errors_1.NotFoundError('Package');
        }
        res.status(200).json({
            status: 'success',
            data: pkg,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPackage = getPackage;
// Admin-only function to update package
const updatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validate required fields
        if (updateData.price !== undefined && updateData.price <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Price'));
        }
        if (updateData.dataAmount !== undefined && updateData.dataAmount <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Data amount'));
        }
        if (updateData.validityDays !== undefined && updateData.validityDays <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Validity days'));
        }
        // Update package
        const { data: updatedPackage, error } = await supabase_1.supabase
            .from('packages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw error;
        }
        if (!updatedPackage) {
            throw new errors_1.NotFoundError('Package');
        }
        res.status(200).json({
            status: 'success',
            data: updatedPackage,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePackage = updatePackage;
// Admin-only function to delete package
const deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase
            .from('packages')
            .delete()
            .eq('id', id);
        if (error) {
            throw error;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deletePackage = deletePackage;
const getCountries = async (req, res, next) => {
    try {
        // Get all countries at once without pagination
        const { data: countries, error } = await supabaseAdmin
            .from('packages')
            .select('country_name')
            .neq('country_name', null)
            .neq('country_name', '')
            .order('country_name', { ascending: true });
        if (error)
            throw error;
        // Extract unique country names
        const uniqueCountries = Array.from(new Set(countries?.map(c => c.country_name) || [])).filter(Boolean).sort();
        res.status(200).json({
            status: 'success',
            data: uniqueCountries,
            count: uniqueCountries.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCountries = getCountries;
// Get section packages (e.g., most popular)
const getSectionPackages = async (req, res, next) => {
    try {
        const { slug } = req.query;
        if (slug !== 'most-popular') {
            res.status(400).json({
                status: 'error',
                message: 'Invalid section slug'
            });
            return;
        }
        const { data: packages, error } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('show_on_frontend', true)
            .order('homepage_order', { ascending: true });
        if (error) {
            throw error;
        }
        res.json(packages || []);
    }
    catch (error) {
        next(error);
    }
};
exports.getSectionPackages = getSectionPackages;
// Search packages by country and language
const searchPackages = async (req, res, next) => {
    try {
        const { country, lang } = req.query;
        if (!country) {
            res.status(400).json({
                status: 'error',
                message: 'Country parameter is required'
            });
            return;
        }
        // Query packages by country name (case-insensitive)
        const { data: packages, error } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .ilike('country_name', `%${country}%`)
            .order('sale_price', { ascending: true });
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        res.json(packages || []);
    }
    catch (error) {
        console.error('Search packages error:', error);
        next(error);
    }
};
exports.searchPackages = searchPackages;
// Secure admin endpoint: Get all my_packages
const getMyPackages = async (req, res, next) => {
    try {
        const { data: packages, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.status(200).json({ status: 'success', data: packages });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPackages = getMyPackages;
// Secure admin endpoint: Get all Roamify packages
const getAllRoamifyPackages = async (req, res, next) => {
    try {
        // Get all packages without any limit to ensure we get all 11,000+ packages
        const { data: packages, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        console.log(`Retrieved ${packages?.length || 0} packages from database`);
        res.status(200).json({
            status: 'success',
            data: packages || [],
            count: packages?.length || 0
        });
    }
    catch (error) {
        console.error('Error fetching Roamify packages:', error);
        next(error);
    }
};
exports.getAllRoamifyPackages = getAllRoamifyPackages;
// Secure admin endpoint: Get distinct countries from packages
const getPackageCountries = async (req, res, next) => {
    try {
        // Get distinct countries from packages table
        const { data: countries, error } = await supabaseAdmin
            .from('packages')
            .select('country_name')
            .neq('country_name', null)
            .neq('country_name', '')
            .order('country_name', { ascending: true });
        if (error)
            throw error;
        // Extract unique country names
        const uniqueCountries = Array.from(new Set(countries?.map(c => c.country_name) || [])).filter(Boolean).sort();
        res.status(200).json({
            status: 'success',
            data: uniqueCountries,
            count: uniqueCountries.length
        });
    }
    catch (error) {
        console.error('Error fetching package countries:', error);
        next(error);
    }
};
exports.getPackageCountries = getPackageCountries;
// Secure admin endpoint: Deduplicate packages
const deduplicatePackages = async (req, res, next) => {
    try {
        // Get all packages from the packages table (not my_packages)
        const { data: allPackages, error: fetchError } = await supabaseAdmin
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (fetchError)
            throw fetchError;
        if (!allPackages || allPackages.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No packages to deduplicate',
                removedCount: 0
            });
        }
        console.log(`Starting deduplication of ${allPackages.length} packages`);
        // Step 1: Remove duplicate IDs by keeping the most recent version
        const idMap = new Map();
        const packagesToKeep = [];
        const packagesToDelete = [];
        allPackages.forEach(pkg => {
            const id = pkg.reseller_id || pkg.id;
            if (id) {
                if (idMap.has(id)) {
                    // Keep the one with more complete information or more recent
                    const existing = idMap.get(id);
                    const newPkgScore = calculateCompleteness(pkg);
                    const existingScore = calculateCompleteness(existing);
                    if (newPkgScore > existingScore ||
                        (newPkgScore === existingScore && new Date(pkg.created_at) > new Date(existing.created_at))) {
                        // Replace existing with new package
                        packagesToDelete.push(existing.id);
                        idMap.set(id, pkg);
                    }
                    else {
                        // Keep existing, mark new for deletion
                        packagesToDelete.push(pkg.id);
                    }
                }
                else {
                    idMap.set(id, pkg);
                }
            }
            else {
                // Package without reseller_id, keep it
                packagesToKeep.push(pkg);
            }
        });
        // Add unique ID packages to keep list
        packagesToKeep.push(...Array.from(idMap.values()));
        // Step 2: Remove duplicate combinations (country + data + days + price)
        const combinationMap = new Map();
        const finalPackagesToKeep = [];
        let combinationDuplicates = 0;
        packagesToKeep.forEach(pkg => {
            const country = pkg.country_name || pkg.country || '';
            const data = pkg.data_amount || pkg.data || '';
            const days = pkg.validity_days || pkg.days || pkg.day || '';
            const price = pkg.price || pkg.base_price || '';
            const combinationKey = `${country}|${data}|${days}|${price}`;
            if (combinationMap.has(combinationKey)) {
                // Duplicate combination found, mark for deletion
                packagesToDelete.push(pkg.id);
                combinationDuplicates++;
            }
            else {
                combinationMap.set(combinationKey, pkg);
                finalPackagesToKeep.push(pkg);
            }
        });
        // Remove duplicates from database
        if (packagesToDelete.length > 0) {
            console.log(`Attempting to delete ${packagesToDelete.length} duplicate packages...`);
            // Delete in batches to avoid potential issues with large arrays
            const batchSize = 100;
            for (let i = 0; i < packagesToDelete.length; i += batchSize) {
                const batch = packagesToDelete.slice(i, i + batchSize);
                const { error: deleteError } = await supabaseAdmin
                    .from('packages')
                    .delete()
                    .in('id', batch);
                if (deleteError) {
                    console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
                    throw deleteError;
                }
            }
            console.log(`Successfully deleted ${packagesToDelete.length} duplicate packages`);
        }
        console.log(`Deduplication completed: Removed ${packagesToDelete.length} duplicate packages`);
        console.log(`- ID duplicates: ${packagesToDelete.length - combinationDuplicates}`);
        console.log(`- Combination duplicates: ${combinationDuplicates}`);
        res.status(200).json({
            status: 'success',
            message: `Successfully removed ${packagesToDelete.length} duplicate packages`,
            removedCount: packagesToDelete.length,
            remainingCount: finalPackagesToKeep.length,
            details: {
                idDuplicates: packagesToDelete.length - combinationDuplicates,
                combinationDuplicates: combinationDuplicates
            }
        });
    }
    catch (error) {
        console.error('Error deduplicating packages:', error);
        next(error);
    }
};
exports.deduplicatePackages = deduplicatePackages;
// Helper function to calculate package completeness score
function calculateCompleteness(pkg) {
    let score = 0;
    if (pkg.name || pkg.package)
        score += 2;
    if (pkg.country_name || pkg.country)
        score += 2;
    if (pkg.country_code)
        score += 1;
    if (pkg.data_amount || pkg.data)
        score += 2;
    if (pkg.validity_days || pkg.days || pkg.day)
        score += 2;
    if (pkg.price || pkg.base_price)
        score += 2;
    if (pkg.reseller_id)
        score += 1;
    if (pkg.operator)
        score += 1;
    if (pkg.features)
        score += 1;
    return score;
}
//# sourceMappingURL=packageController.js.map