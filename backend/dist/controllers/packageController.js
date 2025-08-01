"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCompletePackageSync = exports.savePackage = exports.syncRoamifyPackages = exports.deduplicatePackages = exports.getPackageCountries = exports.getAllRoamifyPackages = exports.getMyPackages = exports.searchPackages = exports.getSectionPackages = exports.getCountries = exports.deleteMyPackage = exports.deletePackage = exports.updatePackage = exports.getPackage = exports.getAllPackages = exports.createPackage = void 0;
const supabase_1 = require("../config/supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const uuid_1 = require("uuid");
const esimUtils_1 = require("../utils/esimUtils");
// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
// Create admin client for operations that need service role
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('updatePackage controller loaded');
// Admin-only function to create package
const createPackage = async (req, res, next) => {
    try {
        const { name, description, price, dataAmount, days, country, operator, type, } = req.body;
        // Validate required fields (allow 0 for unlimited packages)
        if (!name || !price || dataAmount === undefined || dataAmount === null || days === undefined || days === null || !country || !operator || !type) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.required('All package fields'));
        }
        if (price <= 0) {
            throw new errors_1.ValidationError(errors_1.ErrorMessages.validation.positive('Price'));
        }
        if (dataAmount < 0) {
            throw new errors_1.ValidationError('Data amount must be 0 or greater (0 = unlimited)');
        }
        if (days < 0) {
            throw new errors_1.ValidationError('Days must be 0 or greater (0 = unlimited duration)');
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
        // Parse validity string to integer days
        let validityStr = req.body.validity || req.body.days || days || '';
        let parsedDays = null;
        if (typeof validityStr === 'string') {
            parsedDays = (0, esimUtils_1.parseValidityToDays)(validityStr);
        }
        else if (typeof validityStr === 'number') {
            parsedDays = validityStr;
        }
        if (parsedDays === null || parsedDays < 0) {
            logger_1.logger.warn(`Could not parse days string '${validityStr}' for package create name=${name}`);
            return res.status(400).json({ status: 'error', message: 'Invalid or missing days field' });
        }
        // Overwrite all relevant fields
        const packageData = {
            name,
            description,
            price,
            data_amount: dataAmount,
            days: parsedDays,
            country,
            operator,
            type,
        };
        // Create package
        const { data: newPackage, error } = await supabase_1.supabase
            .from('packages')
            .insert([packageData])
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
        const countryCode = req.query.country_code;
        console.log(`[API] /api/packages received country_code:`, countryCode); // DEBUG LOG
        // STRICT BEHAVIOR: Only return packages that exist in my_packages (admin-approved)
        // If no admin-approved packages exist for a country/slug, return empty list
        let query = supabaseAdmin
            .from('my_packages')
            .select(`
        *
      `)
            .eq('visible', true)
            .eq('show_on_frontend', true);
        // If country_code is provided, filter by it. Otherwise, return all packages (for admin panel)
        if (countryCode && typeof countryCode === 'string' && countryCode.length === 2) {
            query = query.eq('country_code', countryCode.toUpperCase());
            console.log(`[API] /api/packages filtering by country_code:`, countryCode);
        }
        else {
            console.log(`[API] /api/packages returning all packages (no country filter)`);
        }
        const { data, error } = await query.order('data_amount', { ascending: true });
        if (error) {
            throw error;
        }
        if (!data || data.length === 0) {
            console.log(`[API] No admin-approved packages found for country_code: ${countryCode || 'all'}`);
            res.status(200).json({
                status: 'success',
                data: [],
                message: 'No admin-approved packages available for this location'
            });
            return;
        }
        console.log(`[API] /api/packages returning ${data.length} packages from my_packages`);
        res.status(200).json({
            status: 'success',
            data: data,
        });
    }
    catch (error) {
        logger_1.logger.error('[API] /api/packages error', {
            error: error instanceof Error ? error.stack || error.message : error,
            country_code: req.query.country_code,
            path: req.path,
            method: req.method,
            time: new Date().toISOString(),
        });
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
        if (updateData.dataAmount !== undefined && updateData.dataAmount < 0) {
            throw new errors_1.ValidationError('Data amount must be 0 or greater (0 = unlimited)');
        }
        if (updateData.days !== undefined && updateData.days < 0) {
            throw new errors_1.ValidationError('Days must be 0 or greater (0 = unlimited duration)');
        }
        // Parse validity string to integer days
        let validityStr = updateData.validity || updateData.days || '';
        let parsedDays = null;
        if (typeof validityStr === 'string') {
            parsedDays = (0, esimUtils_1.parseValidityToDays)(validityStr);
        }
        else if (typeof validityStr === 'number') {
            parsedDays = validityStr;
        }
        if (parsedDays === null) {
            logger_1.logger.warn(`Could not parse days string '${validityStr}' for package update id=${id}`);
        }
        // Overwrite all relevant fields
        updateData.validity = validityStr;
        updateData.days = parsedDays;
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
// Admin-only function to delete package from my_packages table
const deleteMyPackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('my_packages')
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
exports.deleteMyPackage = deleteMyPackage;
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
// Helper function to decode slug back to country name
function decodeSlug(slug) {
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}
// Helper function to get country mapping for special cases
function getCountryMapping(slug) {
    const mappings = {
        'united-states': { countryName: 'United States', countryCode: 'US' },
        'united-kingdom': { countryName: 'United Kingdom', countryCode: 'GB' },
        'united-arab-emirates': { countryName: 'Dubai', countryCode: 'AE' },
        'uae': { countryName: 'Dubai', countryCode: 'AE' },
        'dubai': { countryName: 'Dubai', countryCode: 'AE' },
        'germany': { countryName: 'Germany', countryCode: 'DE' },
        'france': { countryName: 'France', countryCode: 'FR' },
        'italy': { countryName: 'Italy', countryCode: 'IT' },
        'spain': { countryName: 'Spain', countryCode: 'ES' },
        'europe': { countryName: 'Europe & United States', countryCode: 'EUUS' }
    };
    return mappings[slug.toLowerCase()] || null;
}
// Get section packages (e.g., most popular)
const getSectionPackages = async (req, res, next) => {
    try {
        const { slug } = req.query;
        if (!slug || typeof slug !== 'string') {
            res.status(400).json({ status: 'error', message: 'Missing or invalid section slug' });
            return;
        }
        let packages, error;
        // Handle special case for most-popular
        if (slug === 'most-popular') {
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .eq('location_slug', 'most-popular')
                .order('homepage_order', { ascending: true }));
            if (error)
                throw error;
            console.log(`[API] /api/packages/get-section-packages returning ${packages?.length || 0} admin-approved most popular packages`);
            res.json(packages || []);
            return;
        }
        // Try to get country mapping for special cases
        const countryMapping = getCountryMapping(slug);
        if (countryMapping) {
            // For mapped countries, try exact country_name match first
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('country_name', countryMapping.countryName)
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .order('data_amount', { ascending: true }));
            if (error)
                throw error;
            if (Array.isArray(packages) && packages.length > 0) {
                console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for mapped country: ${countryMapping.countryName}`);
                res.json(packages);
                return;
            }
            // If no exact match, try country_code
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('country_code', countryMapping.countryCode)
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .order('data_amount', { ascending: true }));
            if (error)
                throw error;
            if (Array.isArray(packages) && packages.length > 0) {
                console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for country_code: ${countryMapping.countryCode}`);
                res.json(packages);
                return;
            }
        }
        // Try as country_code (uppercase)
        ({ data: packages, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .eq('country_code', slug.toUpperCase())
            .eq('visible', true)
            .eq('show_on_frontend', true)
            .order('data_amount', { ascending: true }));
        if (error)
            throw error;
        if (Array.isArray(packages) && packages.length > 0) {
            console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for country_code: ${slug}`);
            res.json(packages);
            return;
        }
        // Try as decoded country name (e.g., "united-states" -> "United States")
        const decodedCountryName = decodeSlug(slug);
        ({ data: packages, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .eq('country_name', decodedCountryName)
            .eq('visible', true)
            .eq('show_on_frontend', true)
            .order('data_amount', { ascending: true }));
        if (error)
            throw error;
        if (Array.isArray(packages) && packages.length > 0) {
            console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for decoded country_name: ${decodedCountryName}`);
            res.json(packages);
            return;
        }
        // Try as partial country_name match (original behavior)
        ({ data: packages, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .ilike('country_name', `%${slug}%`)
            .eq('visible', true)
            .eq('show_on_frontend', true)
            .order('data_amount', { ascending: true }));
        if (error)
            throw error;
        if (Array.isArray(packages) && packages.length > 0) {
            console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for partial country_name: ${slug}`);
            res.json(packages);
            return;
        }
        // Try as partial decoded country_name match
        ({ data: packages, error } = await supabaseAdmin
            .from('my_packages')
            .select('*')
            .ilike('country_name', `%${decodedCountryName}%`)
            .eq('visible', true)
            .eq('show_on_frontend', true)
            .order('data_amount', { ascending: true }));
        if (error)
            throw error;
        if (Array.isArray(packages) && packages.length > 0) {
            console.log(`[API] /api/packages/get-section-packages returning ${packages.length} packages for partial decoded country_name: ${decodedCountryName}`);
            res.json(packages);
            return;
        }
        console.log(`[API] /api/packages/get-section-packages no packages found for slug: ${slug} (tried country mapping, country_code, decoded name: ${decodedCountryName})`);
        res.status(404).json({ status: 'error', message: `No packages found for slug: ${slug}` });
    }
    catch (error) {
        console.error(`[API] /api/packages/get-section-packages error for slug: ${req.query.slug}:`, error);
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
        // STRICT BEHAVIOR: Only return admin-approved packages from my_packages
        let packages, error;
        // Ensure country is a string
        const countryStr = Array.isArray(country) ? String(country[0]) : String(country);
        // Handle special cases for merged countries
        let searchCountry = countryStr;
        if (countryStr.toLowerCase().includes('united arab emirates') ||
            countryStr.toLowerCase().includes('uae') ||
            countryStr.toLowerCase() === 'ae') {
            searchCountry = 'Dubai';
        }
        if (searchCountry === 'EU') {
            // For Europe, match by country_code
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('country_code', 'EU')
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .order('data_amount', { ascending: true }));
        }
        else if (searchCountry.toLowerCase() === 'dubai') {
            // For Dubai, match by country_code for exact results
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .eq('country_code', 'AE')
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .order('data_amount', { ascending: true }));
        }
        else {
            // For other countries, match by country_name
            ({ data: packages, error } = await supabaseAdmin
                .from('my_packages')
                .select('*')
                .ilike('country_name', `%${searchCountry}%`)
                .eq('visible', true)
                .eq('show_on_frontend', true)
                .order('data_amount', { ascending: true }));
        }
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        console.log(`[API] /api/search-packages returning ${packages?.length || 0} admin-approved packages for: ${country}`);
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
            .order('data_amount', { ascending: false });
        if (error)
            throw error;
        res.status(200).json({ status: 'success', data: packages });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPackages = getMyPackages;
// Secure admin endpoint: Get all Roamify packages with pagination
const getAllRoamifyPackages = async (req, res, next) => {
    try {
        console.log('Fetching packages from database...');
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        // Check if this is a request for all packages (limit > 1000)
        if (limit > 1000) {
            console.log('Large limit detected, fetching all packages without pagination...');
            // Get total count first
            const { count: totalCount, error: countError } = await supabaseAdmin
                .from('packages')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            if (countError) {
                console.error('Error getting total count:', countError);
                throw countError;
            }
            // Fetch all packages in chunks of 1000 (Supabase limit)
            const allPackages = [];
            const chunkSize = 1000;
            let offset = 0;
            if (!totalCount || totalCount <= 0) {
                console.log('No packages found in database');
                return res.status(200).json({
                    status: 'success',
                    data: [],
                    count: 0,
                    pagination: {
                        page: 1,
                        limit: 0,
                        totalCount: 0,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                });
            }
            while (offset < totalCount) {
                console.log(`Fetching chunk ${Math.floor(offset / chunkSize) + 1}/${Math.ceil(totalCount / chunkSize)} (offset ${offset}, limit ${chunkSize})`);
                const { data: chunk, error } = await supabaseAdmin
                    .from('packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('data_amount', { ascending: true })
                    .range(offset, offset + chunkSize - 1);
                if (error) {
                    console.error('Error fetching packages chunk:', error);
                    throw error;
                }
                if (chunk && chunk.length > 0) {
                    allPackages.push(...chunk);
                    console.log(`Fetched ${chunk.length} packages in this chunk`);
                }
                offset += chunkSize;
            }
            console.log(`Found ${allPackages.length} packages in database (all packages)`);
            // Map the packages to the expected format for frontend compatibility
            const mappedPackages = allPackages.map((pkg) => ({
                id: pkg.id,
                country: pkg.country_name,
                region: pkg.region || 'Global',
                description: `${pkg.data_amount} - ${pkg.days} days`,
                data: pkg.data_amount,
                validity: `${pkg.days} days`,
                price: pkg.price,
                // Add additional fields for backward compatibility
                packageId: pkg.id,
                package: pkg.name,
                packageName: pkg.name,
                name: pkg.name,
                country_name: pkg.country_name,
                country_code: pkg.country_code,
                dataAmount: pkg.data_amount,
                days: pkg.days,
                base_price: pkg.price,
                operator: pkg.operator,
                features: pkg.features,
                is_active: pkg.is_active,
                created_at: pkg.created_at,
                updated_at: pkg.updated_at
            }));
            // Log a sample package for debugging
            if (mappedPackages.length > 0) {
                console.log('Sample mapped package:', mappedPackages[0]);
            }
            return res.status(200).json({
                status: 'success',
                data: mappedPackages,
                count: mappedPackages.length,
                pagination: {
                    page: 1,
                    limit: mappedPackages.length,
                    totalCount,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }
        // Original pagination logic for normal requests
        const offset = (page - 1) * limit;
        // Get total count first
        const { count: totalCount, error: countError } = await supabaseAdmin
            .from('packages')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        if (countError) {
            console.error('Error getting total count:', countError);
            throw countError;
        }
        // Get packages from the packages table with pagination
        const { data: packages, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .eq('is_active', true)
            .order('data_amount', { ascending: true })
            .range(offset, offset + limit - 1);
        if (error) {
            console.error('Error fetching packages from database:', error);
            throw error;
        }
        console.log(`Found ${packages?.length || 0} packages in database (page ${page}, limit ${limit})`);
        // Map the packages to the expected format for frontend compatibility
        const mappedPackages = (packages || []).map((pkg) => ({
            id: pkg.id,
            country: pkg.country_name,
            region: pkg.region || 'Global',
            description: `${pkg.data_amount} - ${pkg.days} days`,
            data: pkg.data_amount,
            validity: `${pkg.days} days`,
            price: pkg.price,
            // Add additional fields for backward compatibility
            packageId: pkg.id,
            package: pkg.name,
            packageName: pkg.name,
            name: pkg.name,
            country_name: pkg.country_name,
            country_code: pkg.country_code,
            dataAmount: pkg.data_amount,
            days: pkg.days,
            base_price: pkg.price,
            operator: pkg.operator,
            features: pkg.features,
            is_active: pkg.is_active,
            created_at: pkg.created_at,
            updated_at: pkg.updated_at
        }));
        // Calculate pagination info
        const totalPages = Math.ceil((totalCount || 0) / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        // Log a sample package for debugging
        if (mappedPackages.length > 0) {
            console.log('Sample mapped package:', mappedPackages[0]);
        }
        return res.status(200).json({
            status: 'success',
            data: mappedPackages,
            count: mappedPackages.length,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    }
    catch (error) {
        console.error('Error fetching Roamify packages:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch Roamify packages' });
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
            .order('data_amount', { ascending: true });
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
            .order('data_amount', { ascending: false });
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
            const days = pkg.days || '';
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
    if (pkg.days)
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
// Secure admin endpoint: Sync packages from Roamify API to database
const syncRoamifyPackages = async (req, res, next) => {
    try {
        console.log('Starting Roamify packages sync...');
        // Fetch all packages from Roamify API (no pagination needed)
        console.log('Fetching packages from Roamify API...');
        try {
            const response = await fetch(`${ROAMIFY_API_BASE}/api/esim/packages`, {
                headers: {
                    Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Roamify API error response:`, errorText);
                throw new Error(`Roamify API responded with status: ${response.status} - ${errorText}`);
            }
            const json = await response.json();
            // Debug: Log the raw response structure
            console.log('=== RAW ROAMIFY API RESPONSE ===');
            console.log('Response type:', typeof json);
            console.log('Top-level keys:', Object.keys(json || {}));
            console.log('=== END RAW RESPONSE ===');
            // Check if we have the expected response structure: data.packages (array of countries)
            if (!json.data || !json.data.packages || json.data.packages.length === 0) {
                console.log('No packages found in Roamify API response');
                return res.status(200).json({
                    status: 'success',
                    message: 'No packages found from Roamify API',
                    syncedCount: 0
                });
            }
            // Flatten all country packages and attach country info
            const countryObjs = json.data.packages;
            let allPackages = [];
            for (const country of countryObjs) {
                if (country.packages && Array.isArray(country.packages)) {
                    for (const pkg of country.packages) {
                        allPackages.push({
                            ...pkg,
                            countryName: country.countryName,
                            countryCode: country.countryCode,
                            region: country.region,
                            geography: country.geography
                        });
                    }
                }
            }
            console.log(`Total packages fetched from Roamify API: ${allPackages.length}`);
            if (allPackages.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    message: 'No packages found from Roamify API',
                    syncedCount: 0
                });
            }
            // Clear existing packages from the packages table
            console.log('Clearing existing packages from database...');
            const { error: deleteError } = await supabaseAdmin
                .from('packages')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
            if (deleteError) {
                console.error('Error clearing packages table:', deleteError);
                throw deleteError;
            }
            console.log('Cleared existing packages from database');
            // Process packages in batches for better performance
            const batchSize = 50;
            let successCount = 0;
            let errorCount = 0;
            for (let i = 0; i < allPackages.length; i += batchSize) {
                const batch = allPackages.slice(i, i + batchSize);
                console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allPackages.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, allPackages.length)} of ${allPackages.length})`);
                const batchData = batch.map(pkg => {
                    try {
                        // Convert dataAmount from MB to GB if needed
                        let dataStr = pkg.dataAmount;
                        if (typeof pkg.dataAmount === 'number') {
                            if (pkg.isUnlimited) {
                                dataStr = 'Unlimited';
                            }
                            else if (pkg.dataAmount > 1024) {
                                dataStr = `${Math.round(pkg.dataAmount / 1024)}GB`;
                            }
                            else {
                                dataStr = `${pkg.dataAmount}MB`;
                            }
                        }
                        // Parse validity string to integer days
                        let validityStr = pkg.validity || pkg.days || '';
                        let parsedDays = null;
                        if (typeof validityStr === 'string') {
                            parsedDays = (0, esimUtils_1.parseValidityToDays)(validityStr);
                        }
                        else if (typeof validityStr === 'number') {
                            parsedDays = validityStr;
                        }
                        if (parsedDays === null) {
                            console.warn(`Could not parse days string '${validityStr}' for package ${pkg.package}`);
                        }
                        // Validate country_code format
                        let countryCode = 'XX'; // Default fallback
                        if (pkg.countryCode) {
                            countryCode = pkg.countryCode.toUpperCase().slice(0, 2);
                        }
                        // Only insert if we have all required fields
                        const missingFields = [];
                        if (!pkg.package)
                            missingFields.push('package');
                        if (!pkg.price)
                            missingFields.push('price');
                        if (!dataStr)
                            missingFields.push('dataStr');
                        if (!parsedDays)
                            missingFields.push('days');
                        if (!pkg.countryName)
                            missingFields.push('countryName');
                        if (missingFields.length > 0) {
                            console.log(`Skipping package due to missing fields [${missingFields.join(', ')}]:`, pkg.package);
                            return null;
                        }
                        return {
                            id: (0, uuid_1.v4)(),
                            name: pkg.package,
                            description: pkg.package || '',
                            price: pkg.price,
                            data_amount: dataStr,
                            days: parsedDays,
                            country_code: countryCode,
                            country_name: pkg.countryName,
                            operator: 'Roamify',
                            type: 'initial',
                            is_active: true,
                            features: {
                                packageId: pkg.packageId,
                                plan: pkg.plan,
                                activation: pkg.activation,
                                isUnlimited: pkg.isUnlimited,
                                withHotspot: pkg.withHotspot,
                                withDataRoaming: pkg.withDataRoaming,
                                withUsageCheck: pkg.withUsageCheck,
                                region: pkg.region,
                                geography: pkg.geography
                            },
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    }
                    catch (error) {
                        console.error(`Error processing package:`, error);
                        console.error('Package data:', pkg);
                        return null;
                    }
                }).filter(Boolean);
                if (batchData.length > 0) {
                    try {
                        const { error } = await supabaseAdmin.from('packages').upsert(batchData, { onConflict: 'id' });
                        if (error) {
                            console.error(`Error syncing batch:`, error);
                            errorCount += batchData.length;
                        }
                        else {
                            successCount += batchData.length;
                            console.log(`✅ Successfully synced ${batchData.length} packages in this batch`);
                        }
                    }
                    catch (error) {
                        console.error(`Error syncing batch:`, error);
                        errorCount += batchData.length;
                    }
                }
            }
            console.log(`\nPackage sync completed!`);
            console.log(`✅ Successfully synced: ${successCount} packages`);
            console.log(`❌ Failed to sync: ${errorCount} packages`);
            console.log(`Total processed: ${successCount + errorCount} packages`);
            res.status(200).json({
                status: 'success',
                message: `Successfully synced ${successCount} packages from Roamify API`,
                syncedCount: successCount,
                errorCount: errorCount,
                totalProcessed: successCount + errorCount
            });
        }
        catch (error) {
            console.error('❌ Failed to fetch from Roamify:', error);
            throw error;
        }
    }
    catch (error) {
        console.error('Error syncing Roamify packages:', error);
        next(error);
    }
};
exports.syncRoamifyPackages = syncRoamifyPackages;
// Helper function to generate Greece-style slugs
function generateGreeceStyleSlug(countryCode, days, dataAmount) {
    // Country code to full name mapping (Greece format)
    const countryMapping = {
        'GR': 'greece',
        'AL': 'albania',
        'DE': 'germany',
        'IT': 'italy',
        'FR': 'france',
        'ES': 'spain',
        'PT': 'portugal',
        'NL': 'netherlands',
        'BE': 'belgium',
        'AT': 'austria',
        'CH': 'switzerland',
        'US': 'united-states',
        'CA': 'canada',
        'UK': 'united-kingdom',
        'GB': 'united-kingdom',
        'IE': 'ireland',
        'NO': 'norway',
        'SE': 'sweden',
        'DK': 'denmark',
        'FI': 'finland',
        'IS': 'iceland',
        'PL': 'poland',
        'CZ': 'czech-republic',
        'HU': 'hungary',
        'RO': 'romania',
        'BG': 'bulgaria',
        'HR': 'croatia',
        'SI': 'slovenia',
        'SK': 'slovakia',
        'LT': 'lithuania',
        'LV': 'latvia',
        'EE': 'estonia',
        'TR': 'turkey',
        'AE': 'united-arab-emirates',
        'SA': 'saudi-arabia',
        'EG': 'egypt',
        'MA': 'morocco',
        'ZA': 'south-africa',
        'KE': 'kenya',
        'NG': 'nigeria',
        'JP': 'japan',
        'KR': 'south-korea',
        'CN': 'china',
        'IN': 'india',
        'TH': 'thailand',
        'VN': 'vietnam',
        'ID': 'indonesia',
        'MY': 'malaysia',
        'SG': 'singapore',
        'PH': 'philippines',
        'AU': 'australia',
        'NZ': 'new-zealand',
        'BR': 'brazil',
        'AR': 'argentina',
        'CL': 'chile',
        'CO': 'colombia',
        'MX': 'mexico',
        'EU': 'europe',
        'EUS': 'europe-sprint'
    };
    // Special case: Europe Sprint (EUS)
    let countryName = countryMapping[countryCode.toUpperCase()] || countryCode.toLowerCase();
    if (countryCode.toUpperCase() === 'EUS') {
        countryName = 'europe-sprint';
    }
    const dataAmountInt = Math.floor(dataAmount);
    // Generate Greece-style slug: esim-country-30days-1gb-all
    return `esim-${countryName}-${days}days-${dataAmountInt}gb-all`;
}
// Secure admin endpoint: Save package to my_packages
const savePackage = async (req, res) => {
    try {
        const { name, country_name, country_code, data_amount, days, base_price, sale_price, profit, reseller_id, region, visible, show_on_frontend, location_slug, homepage_order, features = {} } = req.body;
        // Validate required fields (allow 0 for unlimited packages)
        if (!name || !country_name || !country_code || data_amount === undefined || data_amount === null || days === undefined || days === null) {
            return res.status(400).json({
                error: 'Missing required fields: name, country_name, country_code, data_amount, days'
            });
        }
        // ✅ CRITICAL FIX: Generate correct slug for Roamify API
        const dataAmountFloat = parseFloat(data_amount);
        const daysInt = parseInt(days);
        const autoSlug = dataAmountFloat === 0 ?
            (country_code.toUpperCase() === 'EUUS' || country_code.toUpperCase() === 'EUS' ?
                `esim-europe-us-${daysInt}days-ungb-all` :
                `esim-${country_code.toLowerCase()}-${daysInt}days-ungb-all`) :
            generateGreeceStyleSlug(country_code, daysInt, dataAmountFloat);
        console.log('✅ Auto-generated Greece-style slug:', autoSlug);
        // ✅ CRITICAL FIX: Use real Roamify package ID from features.packageId or reseller_id
        // Allow null reseller_id since it's now a UUID foreign key
        let finalResellerId = reseller_id;
        let roamifyPackageId = null;
        // First try to get Roamify package ID from features
        if (features && features.packageId) {
            roamifyPackageId = features.packageId;
            console.log('✅ Using Roamify package ID from features:', roamifyPackageId);
        }
        // Fallback to reseller_id if it's a valid Roamify package ID
        else if (finalResellerId && finalResellerId.startsWith('esim-') && finalResellerId.length >= 10) {
            roamifyPackageId = finalResellerId;
            console.log('✅ Using Roamify package ID from reseller_id:', roamifyPackageId);
        }
        // If no valid Roamify package ID provided, use the auto-generated slug
        else {
            roamifyPackageId = autoSlug;
            console.log('✅ Using auto-generated slug as Roamify package ID:', roamifyPackageId);
        }
        // Create package data
        const packageData = {
            id: (0, uuid_1.v4)(), // Generate a UUID for the package
            name,
            country_name,
            country_code: country_code.toUpperCase(),
            data_amount: dataAmountFloat, // Allow 0 for unlimited
            days: daysInt,
            base_price: parseFloat(base_price),
            sale_price: parseFloat(sale_price) || parseFloat(base_price),
            profit: parseFloat(profit) || 0,
            reseller_id: finalResellerId, // Can be null now
            region: region || 'Unknown',
            visible: visible !== false,
            show_on_frontend: show_on_frontend !== false,
            location_slug: dataAmountFloat === 0 ? "most-popular" : (location_slug || country_code.toLowerCase()),
            homepage_order: dataAmountFloat === 0 ? 998 : (parseInt(homepage_order) || 999),
            slug: autoSlug, // ✅ ADD THE SLUG FIELD FOR WEBHOOK
            features: {
                ...features,
                packageId: roamifyPackageId, // Use the real Roamify package ID
                dataAmount: dataAmountFloat,
                days: daysInt,
                currency: 'EUR',
                plan: 'data-only',
                activation: 'first-use',
                isUnlimited: dataAmountFloat === 0, // Set unlimited flag for 0 data amount
                realRoamifyPackageId: roamifyPackageId
            }
        };
        console.log('✅ Saving package with REAL Roamify package ID and slug:', roamifyPackageId);
        // Insert package
        const { data, error } = await supabase_1.supabase
            .from('my_packages')
            .insert(packageData)
            .select()
            .single();
        if (error) {
            console.error('❌ Error saving package:', error);
            return res.status(400).json({ error: error.message });
        }
        console.log('✅ Package saved successfully with auto-generated slug and real Roamify package ID');
        res.json({ success: true, package: data });
    }
    catch (error) {
        console.error('❌ Error in savePackage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.savePackage = savePackage;
// ✅ NEW: Add endpoint to run complete package sync
const runCompletePackageSync = async (req, res) => {
    try {
        console.log('🚀 Starting complete package sync from admin panel...');
        // For now, just return a success message
        // The actual sync can be done via the run_complete_sync_via_admin.js script
        res.json({
            success: true,
            message: 'Complete package sync endpoint is ready. Use the external script to run the sync.',
            instructions: 'Run: node run_complete_sync_via_admin.js'
        });
    }
    catch (error) {
        console.error('❌ Error in runCompletePackageSync:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.runCompletePackageSync = runCompletePackageSync;
//# sourceMappingURL=packageController.js.map