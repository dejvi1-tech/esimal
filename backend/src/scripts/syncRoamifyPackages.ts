import { supabase } from '../config/supabase';
import axios from 'axios';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Function to deduplicate packages
function deduplicatePackages(packages: any[]) {
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
      } else {
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
    } else {
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
function calculateCompleteness(pkg: any): number {
  let score = 0;
  if (pkg.packageId) score += 2;
  if (pkg.package) score += 1;
  if (pkg.price) score += 1;
  if (pkg.dataAmount) score += 1;
  if (pkg.day) score += 1;
  if (pkg.country_name) score += 1;
  if (pkg.country_code) score += 1;
  if (pkg.features) score += 1;
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
    
    // Try to fetch all packages by adding parameters that might help
    const response = await axios.get('https://api.getroamify.com/api/esim/packages', {
      headers: {
        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      params: {
        limit: 10000, // Try to get more packages
        offset: 0,    // Start from the beginning
        all: true     // Some APIs use this to get all data
      },
      timeout: 60000 // 60 second timeout for large responses
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data keys:', Object.keys(response.data || {}));

    // Handle the actual Roamify API response structure
    let packages: any[] = [];
    
    const data = response.data as { status?: string; data?: { packages?: any[] } };
    if (data && data.status === 'success' && data.data && data.data.packages && Array.isArray(data.data.packages)) {
      console.log('Found packages array in response.data.data.packages');
      
      // Extract individual packages from country objects
      for (const country of data.data.packages) {
        if (country.packages && Array.isArray(country.packages)) {
          console.log(`Found ${country.packages.length} packages for ${country.countryName}`);
          // Add country info to each package using separate fields
          const packagesWithCountry = country.packages.map((pkg: any) => ({
            ...pkg,
            country_name: country.countryName || country.country || 'Unknown',
            country_code: country.countryCode || null
          }));
          packages = packages.concat(packagesWithCountry);
        }
      }
    } else {
      console.error('Unexpected API response structure. Available keys:', Object.keys(data || {}));
      if (data && data.data) {
        console.error('Data keys:', Object.keys(data.data));
      }
      throw new Error('Invalid API response structure - no packages array found');
    }

    console.log(`Found ${packages.length} total packages from API`);

    if (packages.length === 0) {
      console.log('No packages found in API response');
      return;
    }

    // Deduplicate packages before processing
    packages = deduplicatePackages(packages);

    // Process packages in batches for better performance
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packages.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, packages.length)} of ${packages.length})`);
      
      const batchData = batch.map(pkg => {
        try {
          // Map data_amount to string as required by schema
          let dataAmountStr = null;
          if (pkg.isUnlimited) {
            dataAmountStr = 'Unlimited';
          } else if (pkg.dataAmount) {
            // Convert MB to GB and format as required
            const gbAmount = Math.round(pkg.dataAmount / 1024);
            dataAmountStr = `${gbAmount}GB`;
          }

          // Validate country_code format
          let countryCode = null;
          if (pkg.country_code) {
            countryCode = pkg.country_code.toUpperCase().slice(0, 2);
          }

          // Only insert if we have all required fields
          if (!pkg.package || !pkg.price || !dataAmountStr || !pkg.day || !countryCode || !pkg.country_name) {
            console.log('Skipping package due to missing required fields:', pkg.package);
            return null;
          }

          return {
            id: uuidv4(),
            name: pkg.package,
            description: pkg.package || '',
            price: pkg.price,
            data_amount: dataAmountStr,
            validity_days: pkg.day,
            country_code: countryCode,
            country_name: pkg.country_name,
            operator: 'Roamify',
            type: 'initial',
            is_active: true,
            features: pkg.features || null,
            reseller_id: pkg.packageId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } catch (error) {
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
          } else {
            successCount += batchData.length;
            console.log(`✓ Successfully synced ${batchData.length} packages in this batch`);
          }
        } catch (error) {
          console.error(`Error syncing batch:`, error);
          errorCount += batchData.length;
        }
      }
    }

    console.log(`\nPackage sync completed!`);
    console.log(`✓ Successfully synced: ${successCount} packages`);
    console.log(`✗ Failed to sync: ${errorCount} packages`);
    console.log(`Total processed: ${successCount + errorCount} packages`);
  } catch (error) {
    console.error('Failed to sync packages:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      console.error('API Error Response:', apiError.response?.data);
      console.error('API Error Status:', apiError.response?.status);
      console.error('API Error Headers:', apiError.response?.headers);
    }
    process.exit(1);
  }
}

// Run the sync
syncPackages().catch(console.error);
