const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function parseValidityToDays(validity) {
  if (typeof validity === 'number') return validity;
  if (typeof validity !== 'string') return 30; // default

  const match = validity.match(/(\d+)/);
  return match ? parseInt(match[1]) : 30;
}

function formatDataAmount(dataAmount, dataUnit = 'MB', isUnlimited = false) {
  if (isUnlimited) return 'Unlimited';
  
  if (typeof dataAmount === 'number') {
    if (dataUnit === 'MB' && dataAmount >= 1024) {
      return `${Math.round(dataAmount / 1024)}GB`;
    } else if (dataUnit === 'GB') {
      return `${dataAmount}GB`;
    } else {
      return `${dataAmount}MB`;
    }
  }
  
  return String(dataAmount);
}

// Get packages from Roamify API
async function fetchRoamifyPackages() {
  try {
    log('info', '📡 Fetching packages from Roamify API...');
    
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    if (response.status !== 200) {
      throw new Error(`Roamify API returned status ${response.status}`);
    }

    const countries = response.data.data?.packages || [];
    const allPackages = countries.flatMap(country => 
      (country.packages || []).map(pkg => ({
        ...pkg,
        countryName: country.countryName,
        countryCode: country.countryCode,
        region: country.region,
        geography: country.geography,
        countrySlug: country.countrySlug
      }))
    );

    log('info', `✅ Found ${allPackages.length} packages from ${countries.length} countries`);
    return allPackages;
    
  } catch (error) {
    log('error', '❌ Failed to fetch packages from Roamify', error.message);
    throw error;
  }
}

// Sync packages to database
async function syncPackagesToDatabase(roamifyPackages, options = {}) {
  try {
    log('info', '🔄 Starting database sync...');
    
    const { 
      clearExisting = true, 
      batchSize = 100,
      updateExisting = true 
    } = options;

    // Clear existing packages if requested
    if (clearExisting) {
      log('info', '🗑️ Clearing existing packages...');
      const { error: deleteError } = await supabase
        .from('packages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        log('warn', '⚠️ Could not clear all packages', deleteError);
      } else {
        log('info', '✅ Cleared existing packages');
      }
    }

    // 3. Transform and deduplicate packages
    log('info', '🔄 Transforming and deduplicating packages...');
    const packagesToUpsert = [];
    const seenResellerIds = new Set();
    const seenCombinations = new Set();
    let duplicateCount = 0;

    for (const pkg of roamifyPackages) {
      try {
        // Use reseller_id for deduplication - prevent duplicate IDs
        if (pkg.packageId && seenResellerIds.has(pkg.packageId)) {
          duplicateCount++;
          log('warn', `⚠️  Skipping duplicate reseller_id: ${pkg.packageId}`);
          continue;
        }

        // Create combination key for content deduplication  
        const combinationKey = `${pkg.countryName}|${pkg.dataAmount}|${pkg.day}|${pkg.price}`;
        if (seenCombinations.has(combinationKey)) {
          duplicateCount++;
          log('warn', `⚠️  Skipping duplicate combination: ${combinationKey}`);
          continue;
        }

        // Format data amount
        const dataAmount = formatDataAmount(
          pkg.dataAmount || 0,
          pkg.dataUnit || 'MB',
          pkg.isUnlimited || false
        );

        // Parse validity days
        const days = parseValidityToDays(pkg.day);

        // Use deterministic UUID based on reseller_id to prevent duplicates
        const packageId = pkg.packageId ? 
          generateDeterministicUUID(pkg.packageId) : 
          uuidv4();

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
          operator: 'Roamify',
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
          reseller_id: pkg.packageId, // Store original Roamify ID for deduplication
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        packagesToUpsert.push(packageData);
        
        // Track seen IDs and combinations
        if (pkg.packageId) seenResellerIds.add(pkg.packageId);
        seenCombinations.add(combinationKey);

      } catch (error) {
        log('error', `❌ Error processing package ${pkg.packageId}:`, error);
      }
    }

    log('info', `📦 Prepared ${packagesToUpsert.length} unique packages for upsert`);
    log('info', `🚫 Skipped ${duplicateCount} duplicate packages`);

    // 4. Upsert packages using reseller_id for conflict resolution
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packagesToUpsert.length; i += batchSize) {
      const batch = packagesToUpsert.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(packagesToUpsert.length / batchSize);
      
      log('info', `📤 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} packages)...`);

      try {
        const { error } = await supabase
          .from('packages')
          .upsert(batch, { 
            onConflict: 'reseller_id',
            ignoreDuplicates: false 
          });

        if (error) {
          log('error', `❌ Batch ${batchNumber} error:`, error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          log('info', `✅ Batch ${batchNumber} successful`);
        }
      } catch (batchError) {
        log('error', `❌ Batch ${batchNumber} failed:`, batchError);
        errorCount += batch.length;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verify results
    const { count: finalCount } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true });

    const syncResults = {
      total_roamify_packages: roamifyPackages.length,
      prepared_for_insertion: packagesToUpsert.length,
      successfully_synced: successCount,
      failed_to_sync: errorCount,
      final_database_count: finalCount
    };

    log('info', '📊 Sync Results:', syncResults);
    return syncResults;

  } catch (error) {
    log('error', '❌ Database sync failed', error.message);
    throw error;
  }
}

// Validate and fix my_packages mappings
async function validateAndFixMyPackages(roamifyPackages) {
  try {
    log('info', '🔍 Validating my_packages mappings...');
    
    // Get all packages from my_packages
    const { data: myPackages, error } = await supabase
      .from('my_packages')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch my_packages: ${error.message}`);
    }

    const roamifyPackageIds = new Set(roamifyPackages.map(pkg => pkg.packageId));
    const validationResults = {
      total: myPackages.length,
      valid: 0,
      invalid: 0,
      missing_reseller_id: 0,
      fixed: 0,
      issues: []
    };

    for (const pkg of myPackages) {
      if (!pkg.reseller_id) {
        validationResults.missing_reseller_id++;
        validationResults.issues.push({
          id: pkg.id,
          name: pkg.name,
          issue: 'missing_reseller_id',
          action: 'needs_manual_review'
        });
        continue;
      }

      if (!roamifyPackageIds.has(pkg.reseller_id)) {
        validationResults.invalid++;
        
        // Try to find a replacement
        const replacement = findReplacementPackage(pkg, roamifyPackages);
        if (replacement) {
          try {
            const { error: updateError } = await supabase
              .from('my_packages')
              .update({ 
                reseller_id: replacement.packageId,
                updated_at: new Date().toISOString()
              })
              .eq('id', pkg.id);

            if (!updateError) {
              validationResults.fixed++;
              validationResults.issues.push({
                id: pkg.id,
                name: pkg.name,
                issue: 'invalid_reseller_id',
                action: 'auto_fixed',
                old_reseller_id: pkg.reseller_id,
                new_reseller_id: replacement.packageId
              });
              log('info', `✅ Fixed mapping: ${pkg.name} -> ${replacement.packageId}`);
            } else {
              validationResults.issues.push({
                id: pkg.id,
                name: pkg.name,
                issue: 'invalid_reseller_id',
                action: 'fix_failed',
                error: updateError.message
              });
            }
          } catch (updateError) {
            log('error', `Failed to update package ${pkg.id}`, updateError);
          }
        } else {
          validationResults.issues.push({
            id: pkg.id,
            name: pkg.name,
            issue: 'invalid_reseller_id',
            action: 'no_replacement_found',
            reseller_id: pkg.reseller_id
          });
        }
      } else {
        validationResults.valid++;
      }
    }

    log('info', '📊 Validation Results:', {
      total: validationResults.total,
      valid: validationResults.valid,
      invalid: validationResults.invalid,
      missing_reseller_id: validationResults.missing_reseller_id,
      fixed: validationResults.fixed
    });

    return validationResults;

  } catch (error) {
    log('error', '❌ Failed to validate my_packages', error.message);
    throw error;
  }
}

// Find replacement package
function findReplacementPackage(invalidPkg, roamifyPackages) {
  // Extract country from package name
  const packageName = invalidPkg.name.toLowerCase();
  const countryMatches = roamifyPackages.filter(pkg => 
    pkg.countryName && packageName.includes(pkg.countryName.toLowerCase())
  );

  if (countryMatches.length > 0) {
    // Find best match by data amount and days
    const dataAmount = invalidPkg.data_amount;
    const days = invalidPkg.days;

    const scored = countryMatches.map(pkg => {
      let score = 0;
      
      // Match data amount
      if (pkg.dataAmount && dataAmount) {
        const pkgData = formatDataAmount(pkg.dataAmount, pkg.dataUnit);
        if (pkgData === dataAmount) score += 3;
        else if (pkgData.includes(dataAmount.replace(/[GB|MB]/g, ''))) score += 2;
      }
      
      // Match days
      const pkgDays = parseValidityToDays(pkg.day || pkg.validity);
      if (pkgDays === days) score += 2;
      else if (Math.abs(pkgDays - days) <= 7) score += 1;

      return { ...pkg, score };
    });

    // Return highest scoring match
    scored.sort((a, b) => b.score - a.score);
    return scored[0].score > 0 ? scored[0] : null;
  }

  return null;
}

// Generate sync report
function generateSyncReport(syncResults, validationResults) {
  const report = {
    timestamp: new Date().toISOString(),
    sync_results: syncResults,
    validation_results: validationResults,
    summary: {
      packages_synced: syncResults.successfully_synced,
      packages_failed: syncResults.failed_to_sync,
      mappings_fixed: validationResults.fixed,
      issues_remaining: validationResults.invalid + validationResults.missing_reseller_id - validationResults.fixed
    },
    recommendations: []
  };

  // Add recommendations
  if (validationResults.missing_reseller_id > 0) {
    report.recommendations.push(`Review ${validationResults.missing_reseller_id} packages missing reseller_id`);
  }
  
  if (validationResults.invalid - validationResults.fixed > 0) {
    report.recommendations.push(`${validationResults.invalid - validationResults.fixed} packages still have invalid mappings`);
  }

  if (syncResults.failed_to_sync > 0) {
    report.recommendations.push(`${syncResults.failed_to_sync} packages failed to sync to database`);
  }

  return report;
}

// Main enhanced sync function
async function enhancedSync(options = {}) {
  const startTime = Date.now();
  
  try {
    log('info', '🚀 Starting enhanced package sync...');

    // 1. Fetch current Roamify packages
    const roamifyPackages = await fetchRoamifyPackages();

    // 2. Sync packages to database
    const syncResults = await syncPackagesToDatabase(roamifyPackages, options);

    // 3. Validate and fix my_packages mappings
    const validationResults = await validateAndFixMyPackages(roamifyPackages);

    // 4. Generate report
    const report = generateSyncReport(syncResults, validationResults);
    report.duration_ms = Date.now() - startTime;

    log('info', '✅ Enhanced sync completed successfully');
    log('info', '📊 Final Report:', report);

    return report;

  } catch (error) {
    log('error', '❌ Enhanced sync failed', error.message);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    clearExisting: !args.includes('--no-clear'),
    batchSize: 100,
    updateExisting: true
  };

  // Parse command line arguments
  if (args.includes('--dry-run')) {
    log('info', '🧪 Running in dry-run mode (no database changes)');
    // TODO: Implement dry-run mode
    return;
  }

  if (args.includes('--help')) {
    console.log(`
Enhanced Package Sync Tool

Usage: node enhancedPackageSync.js [options]

Options:
  --no-clear     Don't clear existing packages from database
  --dry-run      Show what would be done without making changes
  --help         Show this help message

Examples:
  node enhancedPackageSync.js                    # Full sync with clear
  node enhancedPackageSync.js --no-clear        # Sync without clearing
  node enhancedPackageSync.js --dry-run         # Preview changes
    `);
    return;
  }

  try {
    await enhancedSync(options);
    process.exit(0);
  } catch (error) {
    log('error', 'Sync failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  enhancedSync,
  fetchRoamifyPackages,
  syncPackagesToDatabase,
  validateAndFixMyPackages,
  generateSyncReport
};

// Run main function if called directly
if (require.main === module) {
  main();
}

// Helper function to generate deterministic UUID from string
function generateDeterministicUUID(input) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(input).digest('hex');
  
  // Format as UUID v4
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant bits
    hash.substring(20, 32)
  ].join('-');
} 