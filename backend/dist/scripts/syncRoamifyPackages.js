"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
const uuid_1 = require("uuid");
// Load environment variables from backend .env file
dotenv.config({ path: './.env' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const roamifyApiKey = process.env.ROAMIFY_API_KEY;
if (!supabaseUrl || !supabaseServiceKey || !roamifyApiKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
async function fetchAllRoamifyPackages() {
    try {
        console.log('Fetching packages from Roamify API...');
        const response = await axios_1.default.get('https://api.getroamify.com/api/esim/packages', {
            headers: {
                'Authorization': `Bearer ${roamifyApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('=== RAW RESPONSE ===');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('=== END RAW RESPONSE ===');
        // Check for the correct response structure: data.countries
        const responseData = response.data;
        if (!responseData.data || !Array.isArray(responseData.data.countries)) {
            throw new Error('Invalid response structure from Roamify API - expected data.countries array');
        }
        const countries = responseData.data.countries;
        const allPackages = [];
        console.log(`Found ${countries.length} countries with packages`);
        for (const country of countries) {
            if (!Array.isArray(country.packages)) {
                console.log(`No packages array found for country: ${country.countryName}`);
                continue;
            }
            console.log(`Processing ${country.packages.length} packages for ${country.countryName}`);
            const packagesWithCountry = country.packages.map(pkg => ({
                ...pkg,
                countryName: country.countryName,
                countryCode: country.countryCode
            }));
            allPackages.push(...packagesWithCountry);
        }
        console.log(`Total packages found: ${allPackages.length}`);
        return allPackages;
    }
    catch (error) {
        console.error('Error fetching packages from Roamify:', error);
        throw error;
    }
}
function deduplicatePackages(packages) {
    console.log('\n=== Starting Package Deduplication ===');
    console.log(`Initial package count: ${packages.length}`);
    // First, deduplicate by packageId
    const idMap = new Map();
    packages.forEach(pkg => {
        if (!idMap.has(pkg.packageId)) {
            idMap.set(pkg.packageId, pkg);
        }
    });
    const uniqueById = Array.from(idMap.values());
    console.log(`After ID deduplication: ${uniqueById.length} packages`);
    console.log(`Removed ${packages.length - uniqueById.length} duplicate IDs`);
    // Then, deduplicate by combination of key fields
    const combinationMap = new Map();
    uniqueById.forEach(pkg => {
        const key = `${pkg.countryName}-${pkg.dataAmount}-${pkg.dataUnit}-${pkg.day}-${pkg.price}`;
        if (!combinationMap.has(key)) {
            combinationMap.set(key, pkg);
        }
    });
    const finalUnique = Array.from(combinationMap.values());
    console.log(`After combination deduplication: ${finalUnique.length} packages`);
    console.log(`Removed ${uniqueById.length - finalUnique.length} total duplicates`);
    console.log('=== Deduplication Complete ===\n');
    return finalUnique;
}
function convertDataAmount(dataAmount, dataUnit) {
    if (dataUnit === 'MB') {
        return dataAmount / 1024; // Convert MB to GB
    }
    else if (dataUnit === 'GB') {
        return dataAmount;
    }
    else {
        return dataAmount; // Default to original value
    }
}
function mapRoamifyToMyPackage(pkg) {
    const dataAmountGB = convertDataAmount(pkg.dataAmount, pkg.dataUnit);
    const basePrice = pkg.price;
    const salePrice = pkg.price; // You can adjust this based on your pricing strategy
    const profit = salePrice - basePrice;
    return {
        id: (0, uuid_1.v4)(), // Generate a new UUID for each package
        name: pkg.package,
        country_name: pkg.countryName,
        data_amount: dataAmountGB,
        validity_days: pkg.day,
        base_price: basePrice,
        sale_price: salePrice,
        profit: profit
    };
}
async function syncPackagesToDatabase(packages) {
    const batchSize = 50;
    const totalBatches = Math.ceil(packages.length / batchSize);
    console.log(`Syncing ${packages.length} packages in ${totalBatches} batches...`);
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, packages.length);
        const batch = packages.slice(start, end);
        console.log(`Processing batch ${i + 1}/${totalBatches} (${start + 1}-${end} of ${packages.length})`);
        try {
            const { error } = await supabase
                .from('my_packages')
                .upsert(batch, {
                onConflict: 'id',
                ignoreDuplicates: false
            });
            if (error) {
                console.error(`Error syncing batch:`, error);
                failureCount += batch.length;
            }
            else {
                successCount += batch.length;
                console.log(`✓ Successfully synced batch ${i + 1}`);
            }
        }
        catch (error) {
            console.error(`Error syncing batch:`, error);
            failureCount += batch.length;
        }
    }
    console.log('\nPackage sync completed!');
    console.log(`✓ Successfully synced: ${successCount} packages`);
    console.log(`✗ Failed to sync: ${failureCount} packages`);
    console.log(`Total processed: ${packages.length} packages`);
}
async function main() {
    try {
        // Fetch all packages from Roamify
        const roamifyPackages = await fetchAllRoamifyPackages();
        // Deduplicate packages
        const uniquePackages = deduplicatePackages(roamifyPackages);
        // Map to our database structure
        const myPackages = uniquePackages.map(pkg => {
            return mapRoamifyToMyPackage(pkg);
        });
        // Sync to database
        await syncPackagesToDatabase(myPackages);
    }
    catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=syncRoamifyPackages.js.map