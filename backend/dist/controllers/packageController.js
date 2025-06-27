"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountries = exports.deletePackage = exports.updatePackage = exports.getPackage = exports.getAllPackages = exports.createPackage = void 0;
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
        let allCountries = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
            const { data, error } = await supabaseAdmin
                .from('packages')
                .select('country_name')
                .neq('country_name', null)
                .range(offset, offset + batchSize - 1);
            if (error)
                throw error;
            if (!data || data.length === 0)
                break;
            allCountries.push(...data.map((pkg) => pkg.country_name));
            hasMore = data.length === batchSize;
            offset += batchSize;
        }
        // Deduplicate and sort
        const uniqueCountries = Array.from(new Set(allCountries)).filter(Boolean).sort();
        res.status(200).json({
            status: 'success',
            data: uniqueCountries,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCountries = getCountries;
//# sourceMappingURL=packageController.js.map