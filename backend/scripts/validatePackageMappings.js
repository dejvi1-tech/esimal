const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Get all valid Roamify package IDs
async function getValidRoamifyPackageIds() {
  try {
    log('info', '📡 Fetching valid package IDs from Roamify...');
    
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
    const validPackageIds = new Set();
    
    countries.forEach(country => {
      if (country.packages && Array.isArray(country.packages)) {
        country.packages.forEach(pkg => {
          if (pkg.packageId) {
            validPackageIds.add(pkg.packageId);
          }
        });
      }
    });

    log('info', `✅ Found ${validPackageIds.size} valid package IDs from Roamify`);
    return validPackageIds;
    
  } catch (error) {
    log('error', '❌ Failed to fetch valid package IDs from Roamify', error.message);
    throw error;
  }
}

// Validate packages in my_packages table
async function validateMyPackages(validRoamifyIds) {
  try {
    log('info', '🔍 Validating my_packages table...');
    
    const { data: myPackages, error } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id, country_name, data_amount, days, is_active');

    if (error) {
      throw new Error(`Failed to fetch my_packages: ${error.message}`);
    }

    const results = {
      total: myPackages.length,
      valid: 0,
      invalid: 0,
      missing_reseller_id: 0,
      inactive: 0,
      issues: []
    };

    for (const pkg of myPackages) {
      const issue = {
        id: pkg.id,
        name: pkg.name,
        reseller_id: pkg.reseller_id,
        country_name: pkg.country_name,
        is_active: pkg.is_active
      };

      // Check if package is inactive
      if (!pkg.is_active) {
        results.inactive++;
        issue.problems = ['Package is inactive'];
        results.issues.push(issue);
        continue;
      }

      // Check if reseller_id is missing
      if (!pkg.reseller_id) {
        results.missing_reseller_id++;
        issue.problems = ['Missing reseller_id'];
        results.issues.push(issue);
        continue;
      }

      // Check if reseller_id is valid in Roamify
      if (!validRoamifyIds.has(pkg.reseller_id)) {
        results.invalid++;
        issue.problems = ['Invalid reseller_id - not found in Roamify catalog'];
        results.issues.push(issue);
        continue;
      }

      // Package is valid
      results.valid++;
    }

    log('info', '📊 My Packages Validation Results:', {
      total: results.total,
      valid: results.valid,
      invalid: results.invalid,
      missing_reseller_id: results.missing_reseller_id,
      inactive: results.inactive,
      issues_count: results.issues.length
    });

    return results;
    
  } catch (error) {
    log('error', '❌ Failed to validate my_packages', error.message);
    throw error;
  }
}

// Validate packages in packages table
async function validatePackagesTable(validRoamifyIds) {
  try {
    log('info', '🔍 Validating packages table...');
    
    const { data: packages, error } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features, country_name, is_active');

    if (error) {
      throw new Error(`Failed to fetch packages: ${error.message}`);
    }

    const results = {
      total: packages.length,
      valid: 0,
      invalid: 0,
      missing_package_id: 0,
      inactive: 0,
      issues: []
    };

    for (const pkg of packages) {
      const issue = {
        id: pkg.id,
        name: pkg.name,
        reseller_id: pkg.reseller_id,
        features_packageId: pkg.features?.packageId,
        country_name: pkg.country_name,
        is_active: pkg.is_active
      };

      // Check if package is inactive
      if (!pkg.is_active) {
        results.inactive++;
        issue.problems = ['Package is inactive'];
        results.issues.push(issue);
        continue;
      }

      // Extract Roamify package ID (check features.packageId first, then reseller_id)
      const roamifyPackageId = pkg.features?.packageId || pkg.reseller_id;

      if (!roamifyPackageId) {
        results.missing_package_id++;
        issue.problems = ['Missing Roamify package ID (both features.packageId and reseller_id are empty)'];
        results.issues.push(issue);
        continue;
      }

      // Check if package ID is valid in Roamify
      if (!validRoamifyIds.has(roamifyPackageId)) {
        results.invalid++;
        issue.problems = [`Invalid Roamify package ID: ${roamifyPackageId}`];
        results.issues.push(issue);
        continue;
      }

      // Package is valid
      results.valid++;
    }

    log('info', '📊 Packages Table Validation Results:', {
      total: results.total,
      valid: results.valid,
      invalid: results.invalid,
      missing_package_id: results.missing_package_id,
      inactive: results.inactive,
      issues_count: results.issues.length
    });

    return results;
    
  } catch (error) {
    log('error', '❌ Failed to validate packages table', error.message);
    throw error;
  }
}

// Generate validation report
function generateValidationReport(myPackagesResults, packagesResults, validRoamifyIds) {
  const report = {
    timestamp: new Date().toISOString(),
    roamify_packages_count: validRoamifyIds.size,
    my_packages: {
      summary: {
        total: myPackagesResults.total,
        valid: myPackagesResults.valid,
        invalid: myPackagesResults.invalid,
        missing_reseller_id: myPackagesResults.missing_reseller_id,
        inactive: myPackagesResults.inactive
      },
      health_percentage: myPackagesResults.total > 0 ? Math.round((myPackagesResults.valid / myPackagesResults.total) * 100) : 0,
      issues: myPackagesResults.issues
    },
    packages_table: {
      summary: {
        total: packagesResults.total,
        valid: packagesResults.valid,
        invalid: packagesResults.invalid,
        missing_package_id: packagesResults.missing_package_id,
        inactive: packagesResults.inactive
      },
      health_percentage: packagesResults.total > 0 ? Math.round((packagesResults.valid / packagesResults.total) * 100) : 0,
      issues: packagesResults.issues
    },
    overall_health: {
      total_packages: myPackagesResults.total + packagesResults.total,
      total_valid: myPackagesResults.valid + packagesResults.valid,
      total_issues: myPackagesResults.issues.length + packagesResults.issues.length,
      overall_health_percentage: 0
    }
  };

  // Calculate overall health percentage
  if (report.overall_health.total_packages > 0) {
    report.overall_health.overall_health_percentage = Math.round(
      (report.overall_health.total_valid / report.overall_health.total_packages) * 100
    );
  }

  // Add recommendations
  report.recommendations = [];
  
  if (myPackagesResults.missing_reseller_id > 0) {
    report.recommendations.push(`Fix ${myPackagesResults.missing_reseller_id} packages missing reseller_id in my_packages table`);
  }
  
  if (myPackagesResults.invalid > 0) {
    report.recommendations.push(`Update ${myPackagesResults.invalid} packages with invalid reseller_id in my_packages table`);
  }
  
  if (packagesResults.missing_package_id > 0) {
    report.recommendations.push(`Fix ${packagesResults.missing_package_id} packages missing Roamify package ID in packages table`);
  }
  
  if (packagesResults.invalid > 0) {
    report.recommendations.push(`Update ${packagesResults.invalid} packages with invalid Roamify package ID in packages table`);
  }

  if (report.overall_health.overall_health_percentage < 80) {
    report.recommendations.push('Overall package health is below 80% - urgent sync required');
  }

  return report;
}

// Main validation function
async function validatePackageMappings() {
  const startTime = Date.now();
  
  try {
    log('info', '🚀 Starting package mapping validation...');

    // 1. Get valid Roamify package IDs
    const validRoamifyIds = await getValidRoamifyPackageIds();

    // 2. Validate my_packages table
    const myPackagesResults = await validateMyPackages(validRoamifyIds);

    // 3. Validate packages table
    const packagesResults = await validatePackagesTable(validRoamifyIds);

    // 4. Generate comprehensive report
    const report = generateValidationReport(myPackagesResults, packagesResults, validRoamifyIds);
    report.duration_ms = Date.now() - startTime;

    log('info', '✅ Package mapping validation completed');
    log('info', '📊 Validation Report:', report);

    return report;

  } catch (error) {
    log('error', '❌ Package mapping validation failed', error.message);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Package Mapping Validation Tool

Usage: node validatePackageMappings.js [options]

Options:
  --json         Output results in JSON format
  --help         Show this help message

Examples:
  node validatePackageMappings.js              # Run validation with detailed output
  node validatePackageMappings.js --json       # Output JSON only
    `);
    return;
  }

  try {
    const report = await validatePackageMappings();
    
    if (args.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Human-readable summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 PACKAGE VALIDATION SUMMARY');
      console.log('='.repeat(60));
      console.log(`Overall Health: ${report.overall_health.overall_health_percentage}%`);
      console.log(`Total Packages: ${report.overall_health.total_packages}`);
      console.log(`Valid Packages: ${report.overall_health.total_valid}`);
      console.log(`Total Issues: ${report.overall_health.total_issues}`);
      console.log(`Roamify Catalog: ${report.roamify_packages_count} packages`);
      
      if (report.recommendations.length > 0) {
        console.log('\n🔧 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }
      
      console.log('\n💡 Use --json flag for detailed results');
    }
    
    process.exit(report.overall_health.overall_health_percentage >= 80 ? 0 : 1);
    
  } catch (error) {
    log('error', 'Validation failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  validatePackageMappings,
  getValidRoamifyPackageIds,
  validateMyPackages,
  validatePackagesTable,
  generateValidationReport
};

// Run main function if called directly
if (require.main === module) {
  main();
} 