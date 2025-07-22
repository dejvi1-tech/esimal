"use strict";
/**
 * Utility functions for mapping Roamify API fields to Supabase database fields
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapRoamifyToSupabase = mapRoamifyToSupabase;
exports.validateMyPackageData = validateMyPackageData;
exports.parseValidityToDays = parseValidityToDays;
/**
 * Maps a Roamify package to the correct database fields for my_packages table
 * This function handles the field name mapping: days -> days
 */
function mapRoamifyToSupabase(roamifyPkg, salePrice) {
    // Extract name
    const name = roamifyPkg.description || roamifyPkg.packageName || roamifyPkg.name || roamifyPkg.package || 'Unknown Package';
    // Extract country information
    const country_name = roamifyPkg.country || roamifyPkg.country_name || roamifyPkg.countryName || '';
    const country_code = roamifyPkg.country_code || roamifyPkg.countryCode || '';
    // Extract and parse data amount as a number in GB
    let data_amount_raw = roamifyPkg.data || roamifyPkg.dataAmount || roamifyPkg.data_amount || '';
    let data_amount = 0;
    if (typeof data_amount_raw === 'number') {
        data_amount = data_amount_raw;
    }
    else if (typeof data_amount_raw === 'string') {
        const match = data_amount_raw.match(/(\d+(?:\.\d+)?)(GB|MB|KB)?/i);
        if (match) {
            let value = parseFloat(match[1]);
            const unit = match[2]?.toUpperCase() || 'GB';
            if (unit === 'MB')
                value = value / 1024;
            if (unit === 'KB')
                value = value / (1024 * 1024);
            data_amount = value;
        }
    }
    // Extract days - THIS IS THE KEY MAPPING: Roamify's 'days' maps to Supabase's 'days'
    const days = roamifyPkg.days || roamifyPkg.day || 0;
    // Extract pricing
    const base_price = roamifyPkg.price || roamifyPkg.base_price || 0;
    const sale_price_final = salePrice !== undefined ? salePrice : base_price;
    // Extract other fields
    const reseller_id = roamifyPkg.packageId || roamifyPkg.id || null;
    const region = roamifyPkg.region || '';
    return {
        name,
        country_name,
        country_code: country_code.toUpperCase(),
        data_amount,
        days, // This maps directly to the 'days' column in my_packages
        base_price,
        sale_price: sale_price_final,
        profit: sale_price_final - base_price,
        reseller_id,
        region,
        visible: true,
        show_on_frontend: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
/**
 * Validates that all required fields are present for saving to my_packages
 */
function validateMyPackageData(data) {
    const errors = [];
    if (!data.name)
        errors.push('name is required');
    if (!data.country_name)
        errors.push('country_name is required');
    if (!data.country_code)
        errors.push('country_code is required');
    if (data.data_amount === undefined || data.data_amount < 0)
        errors.push('data_amount must be 0 or greater (0 = unlimited)');
    if (data.days === undefined || data.days < 0)
        errors.push('days must be 0 or greater (0 = unlimited duration)');
    if (data.base_price === undefined || data.base_price < 0)
        errors.push('base_price must be 0 or greater');
    if (data.sale_price === undefined || data.sale_price < 0)
        errors.push('sale_price must be 0 or greater');
    return errors;
}
/**
 * Parses a validity string like '30 days' or '7 day' to an integer number of days.
 * Returns the number if already a number.
 */
function parseValidityToDays(validity) {
    if (typeof validity === 'number')
        return validity > 0 ? validity : null;
    if (typeof validity !== 'string')
        return null;
    const match = validity.match(/(\d+)\s*day(s)?/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    // Try to match just a number (e.g. '30')
    const numMatch = validity.match(/^(\d+)$/);
    if (numMatch && numMatch[1]) {
        return parseInt(numMatch[1], 10);
    }
    return null;
}
//# sourceMappingURL=roamifyMapper.js.map