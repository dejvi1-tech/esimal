const cron = require('node-cron');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { v4: uuidv4 } = require('uuid');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

// Logger function
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Email notification function
async function sendSyncReport(report) {
  try {
    // You can implement email sending here if needed
    // For now, just log the report
    log('info', '📧 Sync Report Generated', report);
    
    // TODO: Send email to admins with sync results
    // await sendEmail({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: `Package Sync Report - ${report.status}`,
    //   html: generateReportEmail(report)
    // });
    
  } catch (error) {
    log('error', 'Failed to send sync report email', error);
  }
}

// Get current valid packages from Roamify
async function getCurrentRoamifyPackages() {
  try {
    log('info', '📡 Fetching current packages from Roamify API...');
    
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
        region: country.region
      }))
    );

    log('info', `✅ Found ${allPackages.length} packages from Roamify`);
    return allPackages;
    
  } catch (error) {
    log('error', '❌ Failed to fetch packages from Roamify', error.message);
    throw error;
  }
}

// Validate package mappings in my_packages table
async function validatePackageMappings(roamifyPackages) {
  try {
    log('info', '🔍 Validating package mappings...');
    
    // Get all packages from my_packages table
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
      invalid_packages: []
    };

    for (const pkg of myPackages) {
      if (!pkg.reseller_id) {
        validationResults.missing_reseller_id++;
        validationResults.invalid_packages.push({
          id: pkg.id,
          name: pkg.name,
          issue: 'missing_reseller_id'
        });
        continue;
      }

      if (!roamifyPackageIds.has(pkg.reseller_id)) {
        validationResults.invalid++;
        validationResults.invalid_packages.push({
          id: pkg.id,
          name: pkg.name,
          reseller_id: pkg.reseller_id,
          issue: 'invalid_roamify_package_id'
        });
      } else {
        validationResults.valid++;
      }
    }

    log('info', '📊 Validation Results', validationResults);
    return validationResults;
    
  } catch (error) {
    log('error', '❌ Failed to validate package mappings', error.message);
    throw error;
  }
}

// Fix invalid package mappings
async function fixInvalidMappings(invalidPackages, roamifyPackages) {
  try {
    log('info', '🔧 Fixing invalid package mappings...');
    
    const fixes = [];
    
    for (const invalidPkg of invalidPackages) {
      if (invalidPkg.issue === 'missing_reseller_id') {
        // Skip packages without reseller_id for now
        continue;
      }

      // Find similar package in Roamify catalog
      const similar = findSimilarPackage(invalidPkg, roamifyPackages);
      
      if (similar) {
        try {
          const { error } = await supabase
            .from('my_packages')
            .update({ 
              reseller_id: similar.packageId,
              updated_at: new Date().toISOString()
            })
            .eq('id', invalidPkg.id);

          if (error) {
            log('error', `Failed to update package ${invalidPkg.id}`, error);
          } else {
            fixes.push({
              package_id: invalidPkg.id,
              package_name: invalidPkg.name,
              old_reseller_id: invalidPkg.reseller_id,
              new_reseller_id: similar.packageId,
              match_score: similar.score
            });
            log('info', `✅ Fixed package mapping: ${invalidPkg.name} -> ${similar.packageId}`);
          }
        } catch (error) {
          log('error', `Error updating package ${invalidPkg.id}`, error);
        }
      }
    }

    log('info', `🔧 Fixed ${fixes.length} package mappings`);
    return fixes;
    
  } catch (error) {
    log('error', '❌ Failed to fix package mappings', error.message);
    throw error;
  }
}

// Find similar package in Roamify catalog
function findSimilarPackage(invalidPkg, roamifyPackages) {
  // Simple matching algorithm - can be enhanced
  const candidates = roamifyPackages.filter(pkg => {
    return pkg.countryName && invalidPkg.name && 
           pkg.countryName.toLowerCase().includes(invalidPkg.name.toLowerCase().split(' ')[0]);
  });

  if (candidates.length > 0) {
    // Return the first match with a basic score
    return {
      ...candidates[0],
      score: 0.8 // Basic score - can be enhanced with better matching
    };
  }

  return null;
}

// Main sync function
async function performSync() {
  const startTime = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    status: 'started',
    duration_ms: 0,
    roamify_packages_count: 0,
    validation_results: null,
    fixes_applied: [],
    errors: []
  };

  try {
    log('info', '🔄 Starting scheduled package sync...');

    // 1. Get current Roamify packages
    const roamifyPackages = await getCurrentRoamifyPackages();
    report.roamify_packages_count = roamifyPackages.length;

    // 2. Validate existing mappings
    const validationResults = await validatePackageMappings(roamifyPackages);
    report.validation_results = validationResults;

    // 3. Fix invalid mappings if any
    if (validationResults.invalid > 0) {
      const fixes = await fixInvalidMappings(validationResults.invalid_packages, roamifyPackages);
      report.fixes_applied = fixes;
    }

    // 4. Update report
    report.status = 'completed';
    report.duration_ms = Date.now() - startTime;

    log('info', '✅ Scheduled sync completed successfully', {
      duration: `${report.duration_ms}ms`,
      roamify_packages: report.roamify_packages_count,
      invalid_packages: validationResults.invalid,
      fixes_applied: report.fixes_applied.length
    });

    // 5. Send report
    await sendSyncReport(report);

  } catch (error) {
    report.status = 'failed';
    report.duration_ms = Date.now() - startTime;
    report.errors.push({
      message: error.message,
      stack: error.stack
    });

    log('error', '❌ Scheduled sync failed', error);
    await sendSyncReport(report);
  }
}

// Schedule the sync job
function startScheduledSync() {
  log('info', '⏰ Starting scheduled package sync service...');
  
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    log('info', '⏰ Daily sync triggered by cron job');
    await performSync();
  }, {
    timezone: 'UTC'
  });

  // Also run immediately on startup for testing
  if (process.argv.includes('--run-now')) {
    log('info', '🚀 Running sync immediately for testing...');
    performSync();
  }

  log('info', '✅ Scheduled sync service started - will run daily at 2 AM UTC');
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', '👋 Shutting down scheduled sync service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', '👋 Shutting down scheduled sync service...');
  process.exit(0);
});

// Start the service
if (require.main === module) {
  startScheduledSync();
}

module.exports = {
  performSync,
  startScheduledSync,
  validatePackageMappings,
  getCurrentRoamifyPackages
};

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