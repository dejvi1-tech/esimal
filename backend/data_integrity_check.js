require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDataIntegrity() {
  try {
    console.log('🔍 DATA INTEGRITY CHECK: my_packages vs packages');
    console.log('=' .repeat(60));
    console.log('Purpose: Ensure all my_packages entries have valid references in packages table');
    console.log('Date:', new Date().toISOString());
    console.log('');

    // Get all data
    console.log('📡 Fetching data from both tables...');
    
    const [myPackagesResult, packagesResult] = await Promise.all([
      supabase.from('my_packages').select('*'),
      supabase.from('packages').select('*')
    ]);

    if (myPackagesResult.error) throw myPackagesResult.error;
    if (packagesResult.error) throw packagesResult.error;

    const myPackages = myPackagesResult.data;
    const packages = packagesResult.data;

    console.log(`✅ Loaded ${myPackages.length} entries from my_packages`);
    console.log(`✅ Loaded ${packages.length} entries from packages`);
    console.log('');

    // Create lookup maps for faster checking
    const packagesById = new Map();
    const packagesByIdAndCountry = new Map();

    packages.forEach(pkg => {
      packagesById.set(pkg.id, pkg);
      const key = `${pkg.id}::${pkg.country_name}`;
      packagesByIdAndCountry.set(key, pkg);
    });

    console.log('🔍 ANALYZING DATA INTEGRITY...\n');

    // Analysis categories
    const issues = {
      missingById: [],
      countryMismatch: [],
      completeMismatch: [],
      fieldDifferences: [],
      valid: []
    };

    // Check each package in my_packages
    myPackages.forEach(myPkg => {
      const sourcePackage = packagesById.get(myPkg.id);
      const exactMatch = packagesByIdAndCountry.get(`${myPkg.id}::${myPkg.country_name}`);

      if (!sourcePackage) {
        // Package ID doesn't exist at all
        issues.missingById.push({
          package: myPkg,
          issue: 'Package ID not found in source packages table'
        });
      } else if (!exactMatch) {
        // ID exists but country doesn't match
        issues.countryMismatch.push({
          package: myPkg,
          sourcePackage: sourcePackage,
          issue: `Country mismatch: my_packages="${myPkg.country_name}" vs packages="${sourcePackage.country_name}"`
        });
      } else {
        // Exact match found, check for field differences
        const differences = [];
        
        if (myPkg.name !== exactMatch.name) differences.push('name');
        if (myPkg.data_amount !== exactMatch.data_amount) differences.push('data_amount');
        if (myPkg.days !== exactMatch.days) differences.push('days');

        if (differences.length > 0) {
          issues.fieldDifferences.push({
            package: myPkg,
            sourcePackage: exactMatch,
            differences: differences
          });
        } else {
          issues.valid.push(myPkg);
        }
      }
    });

    // Display results
    displayResults(issues, myPackages.length);

    // Provide recommendations
    provideRecommendations(issues);

    return issues;

  } catch (error) {
    console.error('❌ Error checking data integrity:', error.message);
    throw error;
  }
}

function displayResults(issues, totalPackages) {
  console.log('📊 INTEGRITY CHECK RESULTS');
  console.log('=' .repeat(60));

  // Summary
  const totalIssues = issues.missingById.length + issues.countryMismatch.length + issues.completeMismatch.length;
  const integrityPercentage = ((issues.valid.length + issues.fieldDifferences.length) / totalPackages * 100).toFixed(2);

  console.log(`Total packages in my_packages: ${totalPackages}`);
  console.log(`✅ Valid references: ${issues.valid.length} (${(issues.valid.length/totalPackages*100).toFixed(1)}%)`);
  console.log(`⚠️  Field differences: ${issues.fieldDifferences.length} (${(issues.fieldDifferences.length/totalPackages*100).toFixed(1)}%)`);
  console.log(`❌ Broken references: ${totalIssues} (${(totalIssues/totalPackages*100).toFixed(1)}%)`);
  console.log(`📈 Overall integrity: ${integrityPercentage}%`);
  console.log('');

  // Detailed breakdown
  if (issues.missingById.length > 0) {
    console.log(`❌ MISSING PACKAGES BY ID (${issues.missingById.length}):`);
    issues.missingById.forEach((item, index) => {
      const pkg = item.package;
      console.log(`${index + 1}. ${pkg.id.substring(0, 8)}... - "${pkg.name}"`);
      console.log(`   Country: ${pkg.country_name}, Data: ${pkg.data_amount}GB, Price: $${pkg.sale_price}`);
      console.log(`   Issue: ${item.issue}`);
      console.log('');
    });
  }

  if (issues.countryMismatch.length > 0) {
    console.log(`⚠️  COUNTRY MISMATCHES (${issues.countryMismatch.length}):`);
    issues.countryMismatch.forEach((item, index) => {
      const pkg = item.package;
      const src = item.sourcePackage;
      console.log(`${index + 1}. ${pkg.id.substring(0, 8)}... - "${pkg.name}"`);
      console.log(`   my_packages country: "${pkg.country_name}"`);
      console.log(`   packages country: "${src.country_name}"`);
      console.log(`   Data: ${pkg.data_amount}GB, Price: $${pkg.sale_price}`);
      console.log('');
    });
  }

  if (issues.fieldDifferences.length > 0) {
    console.log(`📝 FIELD DIFFERENCES (${issues.fieldDifferences.length}):`);
    issues.fieldDifferences.slice(0, 10).forEach((item, index) => {
      const pkg = item.package;
      const src = item.sourcePackage;
      console.log(`${index + 1}. ${pkg.id.substring(0, 8)}... - Differences: ${item.differences.join(', ')}`);
      
      item.differences.forEach(field => {
        console.log(`   ${field}: my_packages="${pkg[field]}" vs packages="${src[field]}"`);
      });
      console.log('');
    });
    
    if (issues.fieldDifferences.length > 10) {
      console.log(`   ... and ${issues.fieldDifferences.length - 10} more field differences\n`);
    }
  }

  if (totalIssues === 0 && issues.fieldDifferences.length === 0) {
    console.log('🎉 PERFECT INTEGRITY!');
    console.log('All packages in my_packages have valid, matching references in packages table.');
  }
}

function provideRecommendations(issues) {
  console.log('💡 RECOMMENDATIONS');
  console.log('=' .repeat(60));

  if (issues.missingById.length > 0) {
    console.log(`🗑️  REMOVE ${issues.missingById.length} packages with missing IDs:`);
    console.log('These packages no longer exist in the source data and should be removed.');
    console.log('');
    
    // Generate SQL for removal
    const idsToRemove = issues.missingById.map(item => `'${item.package.id}'`).join(', ');
    console.log('SQL to remove broken references:');
    console.log(`DELETE FROM my_packages WHERE id IN (${idsToRemove});`);
    console.log('');
  }

  if (issues.countryMismatch.length > 0) {
    console.log(`🔄 FIX ${issues.countryMismatch.length} country mismatches:`);
    console.log('These packages exist but have wrong country names. Options:');
    console.log('1. Update my_packages to match packages table');
    console.log('2. Remove and re-add with correct country');
    console.log('');

    // Generate SQL for country fixes
    issues.countryMismatch.forEach(item => {
      const pkg = item.package;
      const src = item.sourcePackage;
      console.log(`-- Fix ${pkg.id.substring(0, 8)}...`);
      console.log(`UPDATE my_packages SET country_name = '${src.country_name}' WHERE id = '${pkg.id}';`);
    });
    console.log('');
  }

  if (issues.fieldDifferences.length > 0) {
    console.log(`📝 REVIEW ${issues.fieldDifferences.length} field differences:`);
    console.log('These packages have matching ID and country but different field values.');
    console.log('Consider if your custom values should be preserved or updated to match source.');
    console.log('');
  }

  console.log('🔧 AUTOMATED FIX OPTIONS:');
  console.log('Run this script with flags:');
  console.log('  --remove-missing    : Remove packages with broken ID references');
  console.log('  --fix-countries     : Update country names to match source');
  console.log('  --sync-fields       : Update name/data/days to match source');
  console.log('');
}

async function applyFixes(issues) {
  const shouldRemoveMissing = process.argv.includes('--remove-missing');
  const shouldFixCountries = process.argv.includes('--fix-countries');
  const shouldSyncFields = process.argv.includes('--sync-fields');

  if (!shouldRemoveMissing && !shouldFixCountries && !shouldSyncFields) {
    console.log('No fix flags provided. Run with --help to see options.');
    return;
  }

  console.log('🔧 APPLYING FIXES...\n');

  // Remove missing packages
  if (shouldRemoveMissing && issues.missingById.length > 0) {
    console.log(`🗑️  Removing ${issues.missingById.length} packages with broken references...`);
    
    const idsToRemove = issues.missingById.map(item => item.package.id);
    const { error } = await supabase
      .from('my_packages')
      .delete()
      .in('id', idsToRemove);

    if (error) {
      console.log(`❌ Error removing packages: ${error.message}`);
    } else {
      console.log(`✅ Removed ${idsToRemove.length} packages with broken references`);
    }
    console.log('');
  }

  // Fix country mismatches
  if (shouldFixCountries && issues.countryMismatch.length > 0) {
    console.log(`🔄 Fixing ${issues.countryMismatch.length} country mismatches...`);
    
    for (const item of issues.countryMismatch) {
      const { error } = await supabase
        .from('my_packages')
        .update({ 
          country_name: item.sourcePackage.country_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.package.id);

      if (error) {
        console.log(`❌ Error fixing ${item.package.id}: ${error.message}`);
      } else {
        console.log(`✅ Fixed country for ${item.package.id.substring(0, 8)}...`);
      }
    }
    console.log('');
  }

  // Sync field differences
  if (shouldSyncFields && issues.fieldDifferences.length > 0) {
    console.log(`📝 Syncing ${issues.fieldDifferences.length} field differences...`);
    
    for (const item of issues.fieldDifferences) {
      const updates = {};
      
      if (item.differences.includes('name')) updates.name = item.sourcePackage.name;
      if (item.differences.includes('data_amount')) updates.data_amount = item.sourcePackage.data_amount;
      if (item.differences.includes('days')) updates.days = item.sourcePackage.days;
      
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('my_packages')
        .update(updates)
        .eq('id', item.package.id);

      if (error) {
        console.log(`❌ Error syncing ${item.package.id}: ${error.message}`);
      } else {
        console.log(`✅ Synced fields for ${item.package.id.substring(0, 8)}... (${item.differences.join(', ')})`);
      }
    }
  }
}

async function main() {
  try {
    const issues = await checkDataIntegrity();

    // Apply fixes if requested
    const hasFixFlags = process.argv.some(arg => arg.startsWith('--') && arg !== '--help');
    if (hasFixFlags) {
      await applyFixes(issues);
      
      // Re-run check to show results
      console.log('🔄 Re-checking integrity after fixes...\n');
      await checkDataIntegrity();
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help')) {
  console.log('Data Integrity Checker: my_packages vs packages');
  console.log('');
  console.log('Usage:');
  console.log('  node data_integrity_check.js                    # Check only');
  console.log('  node data_integrity_check.js --remove-missing   # Remove broken references');
  console.log('  node data_integrity_check.js --fix-countries    # Fix country mismatches');
  console.log('  node data_integrity_check.js --sync-fields      # Sync field differences');
  console.log('  node data_integrity_check.js --help             # Show this help');
  console.log('');
  process.exit(0);
}

main().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Data integrity check completed!');
  console.log('Timestamp:', new Date().toISOString());
}); 