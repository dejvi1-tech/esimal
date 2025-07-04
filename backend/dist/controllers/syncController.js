"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyToMyPackages = exports.getSyncStatus = exports.syncRoamifyPackages = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRole);
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
if (!ROAMIFY_API_KEY) {
    throw new Error('Missing required environment variable: ROAMIFY_API_KEY');
}
const ROAMIFY_API_URL = 'https://api.getroamify.com';
// Helper function to convert data amount to string format
function formatDataAmount(dataAmount, dataUnit, isUnlimited) {
    if (isUnlimited) {
        return 'Unlimited';
    }
    if (dataUnit === 'MB') {
        if (dataAmount >= 1024) {
            return `${Math.round(dataAmount / 1024)}GB`;
        }
        else {
            return `${dataAmount}MB`;
        }
    }
    else if (dataUnit === 'GB') {
        return `${dataAmount}GB`;
    }
    return `${dataAmount}${dataUnit}`;
}
// Helper function to parse validity to days
function parseValidityToDays(day) {
    return day || 30; // Default to 30 days if not specified
}
/**
 * Sync all packages from Roamify API to Supabase packages table
 */
const syncRoamifyPackages = async (req, res, next) => {
    try {
        console.log('🔄 Starting Roamify packages sync...');
        // 1. Fetch packages from Roamify API
        console.log('📡 Fetching packages from Roamify API...');
        const response = await axios_1.default.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
            headers: {
                'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout
        });
        if (response.status !== 200) {
            throw new Error(`Roamify API returned status ${response.status}`);
        }
        const roamifyData = response.data;
        console.log(`✅ Roamify API response received`);
        if (!roamifyData.data?.packages) {
            throw new Error('Invalid Roamify API response structure');
        }
        // 2. Extract and flatten all packages
        const countries = roamifyData.data.packages;
        let allPackages = [];
        for (const country of countries) {
            if (country.packages && Array.isArray(country.packages)) {
                for (const pkg of country.packages) {
                    allPackages.push({
                        ...pkg,
                        countryName: country.countryName,
                        countryCode: country.countryCode,
                        region: country.region,
                        geography: country.geography,
                        countrySlug: country.countrySlug
                    });
                }
            }
        }
        console.log(`📦 Found ${allPackages.length} packages from ${countries.length} countries`);
        if (allPackages.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No packages found in Roamify API',
                syncedCount: 0
            });
        }
        // 3. Clear existing packages (optional - comment out to keep existing packages)
        console.log('🗑️  Clearing existing packages...');
        const { error: deleteError } = await supabaseAdmin
            .from('packages')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
        if (deleteError) {
            console.error('⚠️  Could not clear packages:', deleteError);
        }
        else {
            console.log('✅ Cleared existing packages');
        }
        // 4. Transform packages for database insertion
        console.log('🔄 Transforming packages...');
        const packagesToInsert = [];
        for (const pkg of allPackages) {
            try {
                // Generate UUID for database
                const packageId = (0, uuid_1.v4)();
                // Format data amount
                const dataAmount = formatDataAmount(pkg.dataAmount || 0, pkg.dataUnit || 'MB', pkg.isUnlimited || false);
                // Parse validity days
                const days = parseValidityToDays(pkg.day);
                // Create package object matching database schema
                const packageData = {
                    id: packageId,
                    name: pkg.package || 'Unknown Package',
                    description: `${dataAmount} for ${days} days in ${pkg.countryName}`,
                    country_name: pkg.countryName || 'Unknown',
                    country_code: pkg.countryCode?.toUpperCase() || 'XX',
                    data_amount: dataAmount,
                    days: days,
                    price: parseFloat(pkg.price) || 0,
                    operator: 'Roamify', // Default operator
                    type: 'initial',
                    features: {
                        packageId: pkg.packageId,
                        plan: pkg.plan || 'data-only',
                        activation: pkg.activation || 'first-use',
                        dataAmount: pkg.dataAmount,
                        dataUnit: pkg.dataUnit,
                        isUnlimited: pkg.isUnlimited || false,
                        withSMS: pkg.withSMS || false,
                        withCall: pkg.withCall || false,
                        withHotspot: pkg.withHotspot || false,
                        withDataRoaming: pkg.withDataRoaming || false,
                        region: pkg.region,
                        geography: pkg.geography,
                        countrySlug: pkg.countrySlug,
                        notes: pkg.notes || []
                    },
                    is_active: true,
                    reseller_id: pkg.packageId, // Store original Roamify ID
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                packagesToInsert.push(packageData);
            }
            catch (error) {
                console.error(`❌ Error processing package ${pkg.packageId}:`, error);
            }
        }
        console.log(`📦 Prepared ${packagesToInsert.length} packages for insertion`);
        // 5. Insert packages in batches
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;
        for (let i = 0; i < packagesToInsert.length; i += batchSize) {
            const batch = packagesToInsert.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(packagesToInsert.length / batchSize);
            console.log(`📤 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} packages)...`);
            try {
                const { error } = await supabaseAdmin
                    .from('packages')
                    .insert(batch);
                if (error) {
                    console.error(`❌ Batch ${batchNumber} error:`, error);
                    errorCount += batch.length;
                }
                else {
                    successCount += batch.length;
                    console.log(`✅ Batch ${batchNumber} successful`);
                }
            }
            catch (batchError) {
                console.error(`❌ Batch ${batchNumber} failed:`, batchError);
                errorCount += batch.length;
            }
            // Small delay between batches to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // 6. Verify results
        const { count: finalCount } = await supabaseAdmin
            .from('packages')
            .select('*', { count: 'exact', head: true });
        console.log('\n📊 Sync Summary:');
        console.log(`✅ Successfully synced: ${successCount} packages`);
        console.log(`❌ Failed to sync: ${errorCount} packages`);
        console.log(`📦 Total packages in database: ${finalCount}`);
        res.status(200).json({
            status: 'success',
            message: 'Roamify packages sync completed',
            syncedCount: successCount,
            failedCount: errorCount,
            totalCount: finalCount,
            sourcePackages: allPackages.length,
            countries: countries.length
        });
    }
    catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to sync Roamify packages',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.syncRoamifyPackages = syncRoamifyPackages;
/**
 * Get sync status and statistics
 */
const getSyncStatus = async (req, res, next) => {
    try {
        // Get packages count
        const { count: packagesCount } = await supabaseAdmin
            .from('packages')
            .select('*', { count: 'exact', head: true });
        // Get my_packages count
        const { count: myPackagesCount } = await supabaseAdmin
            .from('my_packages')
            .select('*', { count: 'exact', head: true });
        // Get sample packages
        const { data: samplePackages } = await supabaseAdmin
            .from('packages')
            .select('*')
            .limit(3);
        res.status(200).json({
            status: 'success',
            data: {
                packagesCount: packagesCount || 0,
                myPackagesCount: myPackagesCount || 0,
                samplePackages: samplePackages || [],
                lastSync: null // TODO: Store last sync timestamp
            }
        });
    }
    catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get sync status'
        });
    }
};
exports.getSyncStatus = getSyncStatus;
/**
 * Copy selected packages from packages table to my_packages table
 */
const copyToMyPackages = async (req, res, next) => {
    try {
        const { packageIds } = req.body;
        if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'packageIds array is required'
            });
        }
        // Fetch the selected packages
        const { data: selectedPackages, error: fetchError } = await supabaseAdmin
            .from('packages')
            .select('*')
            .in('id', packageIds);
        if (fetchError) {
            throw fetchError;
        }
        if (!selectedPackages || selectedPackages.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No packages found with provided IDs'
            });
        }
        // Transform packages for my_packages table
        const myPackagesToInsert = selectedPackages.map(pkg => {
            // Auto-generate Roamify package configuration if not present
            const countryCodeLower = pkg.country_code?.toLowerCase() || 'global';
            const dataAmountInt = Math.floor(pkg.features?.dataAmount || pkg.data_amount || 1);
            const days = pkg.days || 30;
            const autoRoamifyPackageId = `esim-${countryCodeLower}-${days}days-${dataAmountInt}gb-all`;
            return {
                id: (0, uuid_1.v4)(), // Generate new UUID for my_packages
                name: pkg.name,
                country_name: pkg.country_name,
                country_code: pkg.country_code,
                data_amount: pkg.features?.dataAmount || 0, // Store original MB value
                days: pkg.days,
                base_price: pkg.price,
                sale_price: pkg.price * 1.5, // Add 50% markup by default
                profit: pkg.price * 0.5,
                reseller_id: pkg.reseller_id,
                region: pkg.features?.region || '',
                visible: true,
                show_on_frontend: true,
                homepage_order: 0,
                location_slug: pkg.country_code?.toLowerCase(),
                // PRESERVE OR AUTO-GENERATE FEATURES
                features: pkg.features ? {
                    ...pkg.features // Preserve existing features if they exist
                } : {
                    // Auto-generate features if not present
                    packageId: autoRoamifyPackageId,
                    dataAmount: pkg.data_amount,
                    days: pkg.days || 30,
                    price: pkg.price || 5.0,
                    currency: 'EUR',
                    plan: 'data-only',
                    activation: 'first-use',
                    isUnlimited: false,
                    withSMS: false,
                    withCall: false,
                    withHotspot: true,
                    withDataRoaming: true,
                    geography: 'local',
                    region: pkg.features?.region || 'Europe',
                    countrySlug: countryCodeLower,
                    notes: []
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        });
        // Insert into my_packages
        const { error: insertError } = await supabaseAdmin
            .from('my_packages')
            .insert(myPackagesToInsert);
        if (insertError) {
            throw insertError;
        }
        res.status(200).json({
            status: 'success',
            message: `Successfully copied ${myPackagesToInsert.length} packages to my_packages`,
            copiedCount: myPackagesToInsert.length
        });
    }
    catch (error) {
        console.error('Error copying to my_packages:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to copy packages to my_packages'
        });
    }
};
exports.copyToMyPackages = copyToMyPackages;
//# sourceMappingURL=syncController.js.map