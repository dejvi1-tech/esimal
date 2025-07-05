import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from backend .env file
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const roamifyApiKey = process.env.ROAMIFY_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !roamifyApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RoamifyPackage {
  packageId: string;
  slug: string; // Add slug field for Roamify V2 API
  package: string;
  plan: string;
  activation: string;
  day: number;
  days?: number;
  price: number;
  isUnlimited: boolean;
  isAPNAutomatic: boolean;
  apn: string;
  dataAmount: number;
  dataUnit: string;
  callType: string;
  callAmount: number;
  callUnit: string;
  smsType: string;
  smsAmount: number;
  smsUnit: string;
  withSMS: boolean;
  withCall: boolean;
  withHotspot: boolean;
  withDataRoaming: boolean;
  withDestinationInstall: boolean;
  withUsageCheck: boolean;
  withThrottle: boolean;
  throttle: {
    throttleSpeed: number;
    throttleSpeedUnit: string;
    throttleThreshold: number;
    throttleThresholdUnit: string;
  };
  notes: string[];
}

interface RoamifyCountry {
  id: string;
  countryName: string;
  countryCode: string;
  countrySlug: string;
  region: string;
  geography: string;
  minPrice: number;
  maxPrice: number;
  image: string;
  signals: Array<{
    code: string;
    name: string;
    networks: string[];
    carriers: string[];
  }>;
  packages: RoamifyPackage[];
}

interface RoamifyResponse {
  data: RoamifyCountry[];
}

interface MyPackage {
  id: string;
  name: string;
  country_name: string;
  data_amount: number;
  days: number;
  base_price: number;
  sale_price: number;
  profit: number;
  slug: string; // Add slug field for Roamify V2 API
}

interface RoamifyPackageWithCountry extends RoamifyPackage {
  countryName: string;
  countryCode: string;
}

// --- Country name to ISO2 code mapping (auto-generated from frontend/src/data/countries.ts) ---
const countryNameToISO2: Record<string, string> = {
  'Albania': 'AL', 'Andorra': 'AD', 'Austria': 'AT', 'Belarus': 'BY', 'Belgium': 'BE',
  'Bosnia and Herzegovina': 'BA', 'Bulgaria': 'BG', 'Croatia': 'HR', 'Cyprus': 'CY',
  'Czech Republic': 'CZ', 'Denmark': 'DK', 'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR',
  'Georgia': 'GE', 'Germany': 'DE', 'Greece': 'GR', 'Hungary': 'HU', 'Iceland': 'IS',
  'Ireland': 'IE', 'Italy': 'IT', 'Kosovo': 'XK', 'Latvia': 'LV', 'Liechtenstein': 'LI',
  'Lithuania': 'LT', 'Luxembourg': 'LU', 'Malta': 'MT', 'Moldova': 'MD', 'Monaco': 'MC',
  'Montenegro': 'ME', 'Netherlands': 'NL', 'North Macedonia': 'MK', 'Norway': 'NO',
  'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO', 'Russia': 'RU', 'San Marino': 'SM',
  'Serbia': 'RS', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Spain': 'ES', 'Sweden': 'SE',
  'Switzerland': 'CH', 'Turkey': 'TR', 'Ukraine': 'UA', 'United Kingdom': 'GB',
  'Vatican City': 'VA', 'United States': 'US', 'Canada': 'CA', 'Mexico': 'MX',
  'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN', 'Thailand': 'TH',
  'Singapore': 'SG', 'Australia': 'AU', 'New Zealand': 'NZ', 'South Africa': 'ZA',
  'Egypt': 'EG', 'United Arab Emirates': 'AE', 'Dubai': 'DUBAI', 'Saudi Arabia': 'SA',
  'Israel': 'IL'
};

async function fetchAllRoamifyPackages(): Promise<any[]> {
  try {
    console.log('Fetching packages from Roamify API...');
    
    const response = await axios.get('https://api.getroamify.com/api/esim/packages', {
      headers: {
        'Authorization': `Bearer ${roamifyApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const json: any = response.data;
    console.log('=== RAW RESPONSE ===');
    console.log(JSON.stringify(json, null, 2));
    console.log('=== END RAW RESPONSE ===');

    console.log('Object.keys(json):', Object.keys(json));
    if (json.data && typeof json.data === 'object') {
      console.log('Object.keys(json.data):', Object.keys(json.data));
    }

    if (!json.data || !Array.isArray(json.data.packages)) {
      throw new Error('Invalid response structure from Roamify API: expected data.packages array');
    }

    const allPackages: any[] = [];

    for (const country of json.data.packages) {
      if (!Array.isArray(country.packages)) continue;
      for (const pkg of country.packages) {
        if (!pkg.packageId || !pkg.price) continue;
        allPackages.push({
          id: pkg.packageId,
          slug: pkg.packageId, // Use packageId as the canonical slug
          country: country.countryName,
          countryCode: country.countryCode,
          region: country.region,
          description: pkg.package,
          data: (pkg.dataAmount !== undefined && pkg.dataUnit) ? `${pkg.dataAmount} ${pkg.dataUnit}` : undefined,
          days: pkg.day || pkg.days || undefined,
          price: pkg.price,
          withDataRoaming: pkg.withDataRoaming,
          // Add any other fields needed for frontend here
        });
      }
    }

    console.log('Flattened allPackages array:', allPackages.slice(0, 3)); // Log a sample
    console.log(`Total packages returned: ${allPackages.length}`);
    return allPackages;
  } catch (error) {
    console.error('Error fetching packages from Roamify:', error);
    throw error;
  }
}

function deduplicatePackages(packages: RoamifyPackageWithCountry[]): RoamifyPackageWithCountry[] {
  console.log('\n=== Starting Package Deduplication ===');
  console.log(`Initial package count: ${packages.length}`);
  
  // First, deduplicate by packageId
  const idMap = new Map<string, RoamifyPackageWithCountry>();
  packages.forEach(pkg => {
    if (!idMap.has(pkg.packageId)) {
      idMap.set(pkg.packageId, pkg);
    }
  });
  
  const uniqueById = Array.from(idMap.values());
  console.log(`After ID deduplication: ${uniqueById.length} packages`);
  console.log(`Removed ${packages.length - uniqueById.length} duplicate IDs`);
  
  // Then, deduplicate by combination of key fields
  const combinationMap = new Map<string, RoamifyPackageWithCountry>();
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

function convertDataAmount(dataAmount: number, dataUnit: string): number {
  if (dataUnit === 'MB') {
    return dataAmount / 1024; // Convert MB to GB
  } else if (dataUnit === 'GB') {
    return dataAmount;
  } else {
    return dataAmount; // Default to original value
  }
}

function mapRoamifyToMyPackage(pkg: RoamifyPackageWithCountry): MyPackage | null {
  const dataAmountGB = convertDataAmount(pkg.dataAmount, pkg.dataUnit);
  const basePrice = pkg.price;
  const salePrice = pkg.price; // You can adjust this based on your pricing strategy
  const profit = salePrice - basePrice;

  // Validate days
  const days = pkg.day || pkg.days;
  if (!days || typeof days !== 'number' || days <= 0) {
    console.warn(`[SKIP] Package ${pkg.packageId} skipped: missing or invalid days field (got: ${days})`);
    return null;
  }

  // Use Roamify's exact slug field - no fallback generation
  if (!pkg.slug) {
    console.warn(`[SKIP] Package ${pkg.packageId} skipped: missing slug field from Roamify API`);
    return null;
  }

  return {
    id: uuidv4(), // Generate a new UUID for each package
    name: pkg.package,
    country_name: pkg.countryName,
    data_amount: dataAmountGB,
    days: days, // Use Roamify's days field
    base_price: basePrice,
    sale_price: salePrice,
    profit: profit,
    slug: pkg.slug // Store exactly what Roamify returns
  };
}

async function syncPackagesToDatabase(packages: MyPackage[]): Promise<void> {
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
      } else {
        successCount += batch.length;
        console.log(`✓ Successfully synced batch ${i + 1}`);
      }
    } catch (error) {
      console.error(`Error syncing batch:`, error);
      failureCount += batch.length;
    }
  }

  console.log('\nPackage sync completed!');
  console.log(`✓ Successfully synced: ${successCount} packages`);
  console.log(`✗ Failed to sync: ${failureCount} packages`);
  console.log(`Total processed: ${packages.length} packages`);
}

function normalizePackage(pkg: any): any {
  const countryName = pkg.country || 'Unknown';
  const countryCode = countryNameToISO2[countryName] || 'XX';
  return {
    id: pkg.id,
    country_name: countryName,
    country_code: countryCode,
    region: pkg.region,
    description: pkg.description,
    data: pkg.data,
    validity: pkg.validity,
    price: pkg.price,
    withDataRoaming: pkg.withDataRoaming
    // Add other fields as needed
  };
}

async function main() {
  try {
    // Fetch all packages from Roamify
    const roamifyPackages = await fetchAllRoamifyPackages();
    // Deduplicate packages
    const uniquePackages = deduplicatePackages(roamifyPackages);
    // Normalize and filter out any with null country fields
    const normalizedPackages = uniquePackages.map(normalizePackage).filter(pkg => pkg.country_name !== null && pkg.country_code !== null);
    // Map and filter out invalid packages (missing/invalid days)
    const mappedPackages = normalizedPackages
      .map(mapRoamifyToMyPackage)
      .filter((pkg): pkg is MyPackage => pkg !== null);
    // Sync to database
    await syncPackagesToDatabase(mappedPackages);
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

main();
