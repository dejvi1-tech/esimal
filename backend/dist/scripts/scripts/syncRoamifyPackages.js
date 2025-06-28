"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
const supabase_js_1 = require("@supabase/supabase-js");
// Load environment variables
(0, dotenv_1.config)();
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Function to deduplicate packages
function deduplicatePackages(packages) {
    console.log('\n=== Starting Package Deduplication ===');
    console.log(`Initial package count: ${packages.length}`);
    // Step 1: Remove duplicate IDs by keeping the most recent version
    const idMap = new Map();
    packages.forEach(pkg => {
        const id = pkg.packageId || null;
        if (id) {
            // If we already have this ID, keep the one with more complete information
            if (idMap.has(id)) {
                const existing = idMap.get(id);
                const newPkgScore = calculateCompleteness(pkg);
                const existingScore = calculateCompleteness(existing);
                if (newPkgScore > existingScore) {
                    idMap.set(id, pkg);
                }
            }
            else {
                idMap.set(id, pkg);
            }
        }
    });
    // Get packages without IDs and those with unique IDs
    const packagesWithoutIds = packages.filter(pkg => !pkg.packageId);
    const uniqueIdPackages = Array.from(idMap.values());
    let dedupedPackages = [...uniqueIdPackages, ...packagesWithoutIds];
    console.log(`After ID deduplication: ${dedupedPackages.length} packages`);
    console.log(`Removed ${packages.length - dedupedPackages.length} duplicate IDs`);
    // Step 2: Remove duplicate combinations
    const combinationMap = new Map();
    dedupedPackages.forEach(pkg => {
        const country = pkg.country_name || 'unknown';
        const data = pkg.dataAmount || 'unknown';
        const days = pkg.day || 'unknown';
        const price = pkg.price || 'unknown';
        const key = `${country}|${data}|${days}|${price}`;
        if (combinationMap.has(key)) {
            const existing = combinationMap.get(key);
            // Keep the one with an ID over one without, or the one with more complete information
            if ((!existing.packageId && pkg.packageId) ||
                (calculateCompleteness(pkg) > calculateCompleteness(existing))) {
                combinationMap.set(key, pkg);
            }
        }
        else {
            combinationMap.set(key, pkg);
        }
    });
    dedupedPackages = Array.from(combinationMap.values());
    console.log(`After combination deduplication: ${dedupedPackages.length} packages`);
    console.log(`Removed ${packages.length - dedupedPackages.length} total duplicates`);
    console.log('=== Deduplication Complete ===\n');
    return dedupedPackages;
}
// Helper function to calculate how complete a package's information is
function calculateCompleteness(pkg) {
    let score = 0;
    if (pkg.packageId)
        score += 2;
    if (pkg.package)
        score += 1;
    if (pkg.price)
        score += 1;
    if (pkg.dataAmount)
        score += 1;
    if (pkg.day)
        score += 1;
    if (pkg.country_name)
        score += 1;
    if (pkg.country_code)
        score += 1;
    if (pkg.features)
        score += 1;
    return score;
}
async function syncPackages() {
    if (!ROAMIFY_API_KEY) {
        throw new Error('ROAMIFY_API_KEY not set');
    }
    try {
        console.log('Clearing packages table...');
        // Get all existing IDs and delete them
        const { data: existingPackages } = await supabaseAdmin.from('packages').select('id');
        if (existingPackages && existingPackages.length > 0) {
            const ids = existingPackages.map(pkg => pkg.id);
            await supabaseAdmin.from('packages').delete().in('id', ids);
            console.log(`Deleted ${ids.length} existing packages`);
        }
        console.log('Table cleared.');
        console.log('Fetching packages from Roamify API...');
        console.log('Using API Key:', ROAMIFY_API_KEY.substring(0, 10) + '...');
        // Try multiple approaches to get all packages
        let packages = [];
        let totalPackagesFound = 0;
        // Approach 1: Try with high limit
        try {
            console.log('\n=== Approach 1: High limit ===');
            const response1 = await axios_1.default.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
                headers: {
                    Authorization: `Bearer ${ROAMIFY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    limit: 50000, // Very high limit
                    offset: 0
                },
                timeout: 120000 // 2 minute timeout
            });
            const data1 = response1.data;
            // Debug: Log the raw response structure
            console.log('=== RAW ROAMIFY API RESPONSE (Approach 1) ===');
            console.log('Response type:', typeof data1);
            console.log('Top-level keys:', Object.keys(data1 || {}));
            console.log('Full response:', JSON.stringify(data1, null, 2));
            console.log('=== END RAW RESPONSE ===');
            if (data1 && data1.status === 'success' && data1.data && data1.data.packages && Array.isArray(data1.data.packages)) {
                console.log('Found packages array in response.data.data.packages');
                // Flatten all packages with correct mapping
                for (const country of data1.data.packages) {
                    if (country.packages && Array.isArray(country.packages)) {
                        for (const pkg of country.packages) {
                            // Log the raw package for debugging
                            console.log('DEBUG PACKAGE SHAPE:', pkg);
                            // Extract fields with fallbacks
                            const mapped = {
                                id: pkg.packageId || pkg.id || null,
                                country: country.countryName || country.country || country.countryCode || 'unknown',
                                country_code: country.countryCode || 'unknown',
                                region: country.region || country.geography || 'unknown',
                                description: pkg.package || pkg.plan || pkg.activation || 'unknown',
                                price: pkg.price ?? 0,
                                data: pkg.isUnlimited ? 'Unlimited' : (pkg.dataAmount ? `${Math.round(pkg.dataAmount / 1024)}GB` : 'unknown'),
                                duration: pkg.day || pkg.days || pkg.validity || 'unknown',
                                validity: pkg.day || pkg.days || pkg.validity || 'unknown',
                                isUnlimited: pkg.isUnlimited || false,
                                features: {
                                    withSMS: pkg.withSMS,
                                    withCall: pkg.withCall,
                                    withHotspot: pkg.withHotspot,
                                    withDataRoaming: pkg.withDataRoaming,
                                    withDestinationInstall: pkg.withDestinationInstall,
                                    withUsageCheck: pkg.withUsageCheck,
                                    withThrottle: pkg.withThrottle,
                                    throttle: pkg.throttle,
                                },
                                notes: pkg.notes || [],
                            };
                            // Log missing critical fields
                            if (!mapped.id || !mapped.country || !mapped.price || !mapped.data || !mapped.duration) {
                                console.warn('⚠️ Missing critical fields in package:', mapped);
                            }
                            packages.push(mapped);
                        }
                    }
                }
                totalPackagesFound = packages.length;
                console.log(`Approach 1 found ${totalPackagesFound} packages`);
            }
        }
        catch (error) {
            console.error('❌ Failed to fetch from Roamify (Approach 1):', ROAMIFY_API_BASE, error);
            if (error instanceof Error) {
                console.log('Approach 1 failed:', error.message);
            }
            else {
                console.log('Approach 1 failed with unknown error:', error);
            }
        }
        // Approach 2: Try without parameters (default behavior)
        if (totalPackagesFound === 0) {
            try {
                console.log('\n=== Approach 2: No parameters ===');
                const response2 = await axios_1.default.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
                    headers: {
                        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000
                });
                const data2 = response2.data;
                // Debug: Log the raw response structure
                console.log('=== RAW ROAMIFY API RESPONSE (Approach 2) ===');
                console.log('Response type:', typeof data2);
                console.log('Top-level keys:', Object.keys(data2 || {}));
                console.log('Full response:', JSON.stringify(data2, null, 2));
                console.log('=== END RAW RESPONSE ===');
                if (data2 && data2.status === 'success' && data2.data && data2.data.packages && Array.isArray(data2.data.packages)) {
                    console.log('Found packages array in response.data.data.packages');
                    // Flatten all packages with correct mapping
                    for (const country of data2.data.packages) {
                        if (country.packages && Array.isArray(country.packages)) {
                            for (const pkg of country.packages) {
                                // Log the raw package for debugging
                                console.log('DEBUG PACKAGE SHAPE:', pkg);
                                // Extract fields with fallbacks
                                const mapped = {
                                    id: pkg.packageId || pkg.id || null,
                                    country: country.countryName || country.country || country.countryCode || 'unknown',
                                    country_code: country.countryCode || 'unknown',
                                    region: country.region || country.geography || 'unknown',
                                    description: pkg.package || pkg.plan || pkg.activation || 'unknown',
                                    price: pkg.price ?? 0,
                                    data: pkg.isUnlimited ? 'Unlimited' : (pkg.dataAmount ? `${Math.round(pkg.dataAmount / 1024)}GB` : 'unknown'),
                                    duration: pkg.day || pkg.days || pkg.validity || 'unknown',
                                    validity: pkg.day || pkg.days || pkg.validity || 'unknown',
                                    isUnlimited: pkg.isUnlimited || false,
                                    features: {
                                        withSMS: pkg.withSMS,
                                        withCall: pkg.withCall,
                                        withHotspot: pkg.withHotspot,
                                        withDataRoaming: pkg.withDataRoaming,
                                        withDestinationInstall: pkg.withDestinationInstall,
                                        withUsageCheck: pkg.withUsageCheck,
                                        withThrottle: pkg.withThrottle,
                                        throttle: pkg.throttle,
                                    },
                                    notes: pkg.notes || [],
                                };
                                // Log missing critical fields
                                if (!mapped.id || !mapped.country || !mapped.price || !mapped.data || !mapped.duration) {
                                    console.warn('⚠️ Missing critical fields in package:', mapped);
                                }
                                packages.push(mapped);
                            }
                        }
                    }
                    totalPackagesFound = packages.length;
                    console.log(`Approach 2 found ${totalPackagesFound} packages`);
                }
            }
            catch (error) {
                console.error('❌ Failed to fetch from Roamify (Approach 2):', ROAMIFY_API_BASE, error);
                if (error instanceof Error) {
                    console.log('Approach 2 failed:', error.message);
                }
                else {
                    console.log('Approach 2 failed with unknown error:', error);
                }
            }
        }
        // Approach 3: Try with pagination to get ALL packages
        // Always try pagination to ensure we get the complete dataset
        if (totalPackagesFound > 0) {
            try {
                console.log('\n=== Approach 3: Pagination to get ALL packages ===');
                let offset = totalPackagesFound;
                let hasMore = true;
                let page = 1;
                let consecutiveEmptyPages = 0;
                while (hasMore && page <= 50) { // Increased limit to 50 pages to get all 11k+ packages
                    console.log(`Fetching page ${page} with offset ${offset}...`);
                    const response3 = await axios_1.default.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
                        headers: {
                            Authorization: `Bearer ${ROAMIFY_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        params: {
                            limit: 10000, // Increased to 10k per page
                            offset: offset
                        },
                        timeout: 60000 // Increased timeout for larger requests
                    });
                    const data3 = response3.data;
                    if (data3 && data3.status === 'success' && data3.data && data3.data.packages && Array.isArray(data3.data.packages)) {
                        let pagePackages = 0;
                        for (const country of data3.data.packages) {
                            if (country.packages && Array.isArray(country.packages)) {
                                console.log(`);
                            }
                        }
                    }
                }
            }
            finally { }
        }
    }
    finally { }
}
