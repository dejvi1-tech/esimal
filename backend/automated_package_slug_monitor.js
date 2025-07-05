const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Standardized slug format: esim-{country}-{days}days-{data}gb-all
function generateStandardSlug(package) {
  const country = package.country_name?.toLowerCase().replace(/\s+/g, '-');
  const days = package.days || 30;
  const dataAmount = package.data_amount?.toString().replace(/\s+/g, '').toLowerCase();
  
  if (!country || !dataAmount) {
    return null;
  }
  
  return `esim-${country}-${days}days-${dataAmount}gb-all`;
}

class AutomatedPackageSlugMonitor {
  constructor() {
    this.isRunning = false;
    this.lastCheck = null;
    this.stats = {
      totalPackages: 0,
      fixedPackages: 0,
      errorPackages: 0,
      checksPerformed: 0
    };
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log('⚠️ Monitor is already running');
      return;
    }

    console.log(`🚀 Starting automated package slug monitoring (checking every ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Initial check
    await this.performCheck();

    // Set up interval
    setInterval(async () => {
      if (this.isRunning) {
        await this.performCheck();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('🛑 Stopping automated package slug monitoring');
    this.isRunning = false;
  }

  /**
   * Perform a single check and fix cycle
   */
  async performCheck() {
    console.log('\n🔍 Performing automated package slug check...');
    this.lastCheck = new Date();
    this.stats.checksPerformed++;

    try {
      // Step 1: Check my_packages table
      console.log('📦 Checking my_packages table...');
      const myPackagesResult = await this.checkAndFixTable('my_packages');
      
      // Step 2: Check packages table
      console.log('📦 Checking packages table...');
      const packagesResult = await this.checkAndFixTable('packages');

      // Step 3: Update stats
      this.stats.totalPackages = myPackagesResult.total + packagesResult.total;
      this.stats.fixedPackages += myPackagesResult.fixed + packagesResult.fixed;
      this.stats.errorPackages += myPackagesResult.errors + packagesResult.errors;

      // Step 4: Log results
      this.logResults(myPackagesResult, packagesResult);

    } catch (error) {
      console.error('❌ Automated check failed:', error);
      this.stats.errorPackages++;
    }
  }

  /**
   * Check and fix a specific table
   */
  async checkAndFixTable(tableName) {
    const result = {
      table: tableName,
      total: 0,
      fixed: 0,
      errors: 0,
      details: []
    };

    try {
      // Fetch all packages from table
      const { data: packages, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error);
        result.errors++;
        return result;
      }

      result.total = packages.length;
      console.log(`   Found ${packages.length} packages in ${tableName}`);

      // Process packages in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < packages.length; i += batchSize) {
        const batch = packages.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch, tableName);
        
        result.fixed += batchResult.fixed;
        result.errors += batchResult.errors;
        result.details.push(...batchResult.details);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error processing ${tableName}:`, error);
      result.errors++;
    }

    return result;
  }

  /**
   * Process a batch of packages
   */
  async processBatch(packages, tableName) {
    const result = {
      fixed: 0,
      errors: 0,
      details: []
    };

    for (const pkg of packages) {
      try {
        const standardSlug = generateStandardSlug(pkg);
        
        if (!standardSlug) {
          result.details.push({
            package: pkg.name,
            issue: 'Could not generate standard slug',
            reason: 'Missing country_name or data_amount'
          });
          result.errors++;
          continue;
        }

        // Check if slug needs fixing
        if (!pkg.slug || pkg.slug !== standardSlug) {
          // Update the package
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ 
              slug: standardSlug,
              updated_at: new Date().toISOString()
            })
            .eq('id', pkg.id);

          if (updateError) {
            result.details.push({
              package: pkg.name,
              issue: 'Failed to update slug',
              error: updateError.message
            });
            result.errors++;
          } else {
            result.details.push({
              package: pkg.name,
              action: 'Fixed slug',
              oldSlug: pkg.slug || 'none',
              newSlug: standardSlug
            });
            result.fixed++;
          }
        }

      } catch (error) {
        result.details.push({
          package: pkg.name || 'unknown',
          issue: 'Processing error',
          error: error.message
        });
        result.errors++;
      }
    }

    return result;
  }

  /**
   * Log results of the check
   */
  logResults(myPackagesResult, packagesResult) {
    console.log('\n📊 AUTOMATED CHECK RESULTS:');
    console.log(`⏰ Check performed at: ${this.lastCheck.toISOString()}`);
    console.log(`📦 my_packages table: ${myPackagesResult.fixed} fixed, ${myPackagesResult.errors} errors`);
    console.log(`📦 packages table: ${packagesResult.fixed} fixed, ${packagesResult.errors} errors`);
    console.log(`📈 Total packages processed: ${this.stats.totalPackages}`);
    console.log(`🔧 Total packages fixed: ${this.stats.fixedPackages}`);
    console.log(`❌ Total errors: ${this.stats.errorPackages}`);
    console.log(`🔄 Checks performed: ${this.stats.checksPerformed}`);

    // Log detailed results if there were issues
    if (myPackagesResult.errors > 0 || packagesResult.errors > 0) {
      console.log('\n⚠️ DETAILED ISSUES:');
      [...myPackagesResult.details, ...packagesResult.details]
        .filter(detail => detail.issue)
        .forEach(detail => {
          console.log(`   - ${detail.package}: ${detail.issue}`);
        });
    }

    // Log successful fixes
    if (myPackagesResult.fixed > 0 || packagesResult.fixed > 0) {
      console.log('\n✅ SUCCESSFUL FIXES:');
      [...myPackagesResult.details, ...packagesResult.details]
        .filter(detail => detail.action === 'Fixed slug')
        .slice(0, 10) // Show first 10 fixes
        .forEach(detail => {
          console.log(`   - ${detail.package}: ${detail.oldSlug} → ${detail.newSlug}`);
        });
      
      if (myPackagesResult.fixed + packagesResult.fixed > 10) {
        console.log(`   ... and ${myPackagesResult.fixed + packagesResult.fixed - 10} more`);
      }
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Test a specific package slug with Roamify API
   */
  async testSlugWithRoamify(slug) {
    const testPayload = {
      items: [{ packageId: slug, quantity: 1 }]
    };

    try {
      const response = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'esim-marketplace/1.0.0'
        },
        timeout: 10000,
      });

      return { success: true, response: response.data };
    } catch (error) {
      return { 
        success: false, 
        status: error.response?.status,
        data: error.response?.data 
      };
    }
  }

  /**
   * Validate all package slugs
   */
  async validateAllSlugs() {
    console.log('🔍 Validating all package slugs...');

    const { data: allPackages, error } = await supabase
      .from('my_packages')
      .select('*');

    if (error) {
      console.error('❌ Error fetching packages:', error);
      return;
    }

    console.log(`📦 Validating ${allPackages.length} packages...`);

    let validCount = 0;
    let invalidCount = 0;
    const invalidPackages = [];

    for (const pkg of allPackages) {
      const standardSlug = generateStandardSlug(pkg);
      
      if (pkg.slug === standardSlug) {
        validCount++;
      } else {
        invalidCount++;
        invalidPackages.push({
          name: pkg.name,
          currentSlug: pkg.slug,
          expectedSlug: standardSlug
        });
      }
    }

    console.log(`✅ Valid packages: ${validCount}`);
    console.log(`❌ Invalid packages: ${invalidCount}`);

    if (invalidPackages.length > 0) {
      console.log('\n⚠️ INVALID PACKAGES:');
      invalidPackages.slice(0, 20).forEach(pkg => {
        console.log(`   - ${pkg.name}: ${pkg.currentSlug || 'none'} → ${pkg.expectedSlug}`);
      });
      
      if (invalidPackages.length > 20) {
        console.log(`   ... and ${invalidPackages.length - 20} more`);
      }
    }

    return { validCount, invalidCount, invalidPackages };
  }
}

// Create singleton instance
const monitor = new AutomatedPackageSlugMonitor();

// Export for use in other scripts
module.exports = { AutomatedPackageSlugMonitor, monitor };

// If run directly, start monitoring
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--start')) {
    const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 60;
    monitor.startMonitoring(interval);
  } else if (args.includes('--check')) {
    monitor.performCheck().then(() => {
      console.log('✅ Check completed');
      process.exit(0);
    });
  } else if (args.includes('--validate')) {
    monitor.validateAllSlugs().then(() => {
      console.log('✅ Validation completed');
      process.exit(0);
    });
  } else {
    console.log('Usage:');
    console.log('  node automated_package_slug_monitor.js --start [--interval=60]');
    console.log('  node automated_package_slug_monitor.js --check');
    console.log('  node automated_package_slug_monitor.js --validate');
  }
} 