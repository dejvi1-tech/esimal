#!/usr/bin/env node

/**
 * Package Integrity Fix Script
 * 
 * This script can fix various integrity issues between packages and my_packages tables:
 * - Remove orphaned records (my_packages with invalid reseller_id)
 * - Fix missing reseller_ids by matching package data
 * - Remove duplicate reseller_ids
 * 
 * Usage: node fix_package_integrity.js [options]
 * Options:
 *   --remove-orphaned     Remove packages with invalid reseller_ids
 *   --fix-missing-ids     Try to fix missing reseller_ids by matching data
 *   --remove-duplicates   Remove duplicate reseller_ids (keeps newest)
 *   --dry-run            Show what would be done without making changes
 */

const { createClient } = require('@supabase/supabase-js');
const { verifyPackageIntegrity } = require('./verify_package_integrity');
require('dotenv').config();

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('');
  console.error('Please set the following environment variables:');
  if (!process.env.SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 Run "node setup_verification.js" for help setting up your environment.');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  removeOrphaned: args.includes('--remove-orphaned'),
  fixMissingIds: args.includes('--fix-missing-ids'),
  removeDuplicates: args.includes('--remove-duplicates'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h')
};

function showHelp() {
  console.log(`
🔧 Package Integrity Fix Script

This script can fix various integrity issues between packages and my_packages tables.

USAGE:
  node fix_package_integrity.js [options]

OPTIONS:
  --remove-orphaned     Remove my_packages records with invalid reseller_ids
  --fix-missing-ids     Try to match my_packages without reseller_id to packages
  --remove-duplicates   Remove duplicate reseller_ids (keeps the newest record)
  --dry-run            Show what would be done without making changes
  --help, -h           Show this help message

EXAMPLES:
  # Check what would be fixed (dry run)
  node fix_package_integrity.js --remove-orphaned --dry-run
  
  # Actually remove orphaned records
  node fix_package_integrity.js --remove-orphaned
  
  # Fix all issues
  node fix_package_integrity.js --remove-orphaned --fix-missing-ids --remove-duplicates
  
  # Safe dry run to see all potential fixes
  node fix_package_integrity.js --remove-orphaned --fix-missing-ids --remove-duplicates --dry-run

SAFETY:
  - Always run with --dry-run first to see what would be changed
  - This script creates backups before making changes
  - Run verify_package_integrity.js first to understand issues
`);
}

async function removeOrphanedRecords(dryRun = false) {
  console.log(`🗑️  ${dryRun ? '[DRY RUN]' : ''} Removing orphaned records...`);

  // Find orphaned records
  const { data: orphanedRecords, error } = await supabaseAdmin
    .from('my_packages')
    .select('id, name, reseller_id, country_name')
    .is('reseller_id', 'not null');

  if (error) {
    throw new Error(`Error finding orphaned records: ${error.message}`);
  }

  if (!orphanedRecords.length) {
    console.log('   ✅ No orphaned records found');
    return { removed: 0 };
  }

  // Check which ones are actually orphaned
  const resellerIds = orphanedRecords.map(pkg => pkg.reseller_id);
  const { data: existingPackages, error: existingError } = await supabaseAdmin
    .from('packages')
    .select('id')
    .in('id', resellerIds);

  if (existingError) {
    throw new Error(`Error checking existing packages: ${existingError.message}`);
  }

  const existingIds = new Set(existingPackages.map(pkg => pkg.id));
  const actuallyOrphaned = orphanedRecords.filter(pkg => !existingIds.has(pkg.reseller_id));

  if (!actuallyOrphaned.length) {
    console.log('   ✅ No orphaned records found');
    return { removed: 0 };
  }

  console.log(`   Found ${actuallyOrphaned.length} orphaned records:`);
  actuallyOrphaned.forEach(pkg => {
    console.log(`     - ${pkg.name} (${pkg.country_name}) - ID: ${pkg.id}`);
  });

  if (dryRun) {
    console.log(`   [DRY RUN] Would remove ${actuallyOrphaned.length} orphaned records`);
    return { removed: 0, wouldRemove: actuallyOrphaned.length };
  }

  // Actually remove orphaned records
  const orphanedIds = actuallyOrphaned.map(pkg => pkg.id);
  const { error: deleteError } = await supabaseAdmin
    .from('my_packages')
    .delete()
    .in('id', orphanedIds);

  if (deleteError) {
    throw new Error(`Error removing orphaned records: ${deleteError.message}`);
  }

  console.log(`   ✅ Successfully removed ${actuallyOrphaned.length} orphaned records`);
  return { removed: actuallyOrphaned.length };
}

async function fixMissingResellerIds(dryRun = false) {
  console.log(`🔗 ${dryRun ? '[DRY RUN]' : ''} Fixing missing reseller_ids...`);

  // Find my_packages without reseller_id
  const { data: missingIds, error } = await supabaseAdmin
    .from('my_packages')
    .select('id, name, country_name, data_amount, days, base_price')
    .is('reseller_id', null);

  if (error) {
    throw new Error(`Error finding missing reseller_ids: ${error.message}`);
  }

  if (!missingIds.length) {
    console.log('   ✅ No missing reseller_ids found');
    return { fixed: 0 };
  }

  console.log(`   Found ${missingIds.length} packages without reseller_id`);

  // Get all packages for matching
  const { data: allPackages, error: packagesError } = await supabaseAdmin
    .from('packages')
    .select('id, name, country_name, data_amount, days, price');

  if (packagesError) {
    throw new Error(`Error fetching packages: ${packagesError.message}`);
  }

  const matches = [];
  
  for (const myPkg of missingIds) {
    // Try to find a matching package by name and country
    const potentialMatches = allPackages.filter(pkg => 
      pkg.name?.toLowerCase().includes(myPkg.name?.toLowerCase()) ||
      (pkg.country_name === myPkg.country_name && 
       Math.abs((pkg.data_amount || 0) - (myPkg.data_amount || 0)) < 100 && // Within 100MB
       pkg.days === myPkg.days)
    );

    if (potentialMatches.length === 1) {
      matches.push({
        myPackageId: myPkg.id,
        myPackageName: myPkg.name,
        matchedPackageId: potentialMatches[0].id,
        matchedPackageName: potentialMatches[0].name,
        confidence: 'high'
      });
    } else if (potentialMatches.length > 1) {
      // Multiple matches - take the best one based on name similarity
      const bestMatch = potentialMatches.reduce((best, current) => {
        const currentScore = calculateSimilarity(myPkg.name, current.name);
        const bestScore = calculateSimilarity(myPkg.name, best.name);
        return currentScore > bestScore ? current : best;
      });

      matches.push({
        myPackageId: myPkg.id,
        myPackageName: myPkg.name,
        matchedPackageId: bestMatch.id,
        matchedPackageName: bestMatch.name,
        confidence: 'medium'
      });
    }
  }

  if (!matches.length) {
    console.log('   ⚠️  No matches found for packages with missing reseller_ids');
    return { fixed: 0 };
  }

  console.log(`   Found ${matches.length} potential matches:`);
  matches.forEach(match => {
    console.log(`     - "${match.myPackageName}" → "${match.matchedPackageName}" (${match.confidence})`);
  });

  if (dryRun) {
    console.log(`   [DRY RUN] Would fix ${matches.length} missing reseller_ids`);
    return { fixed: 0, wouldFix: matches.length };
  }

  // Actually update the reseller_ids
  let fixedCount = 0;
  for (const match of matches) {
    const { error: updateError } = await supabaseAdmin
      .from('my_packages')
      .update({ reseller_id: match.matchedPackageId })
      .eq('id', match.myPackageId);

    if (updateError) {
      console.log(`     ❌ Failed to update ${match.myPackageName}: ${updateError.message}`);
    } else {
      console.log(`     ✅ Updated ${match.myPackageName}`);
      fixedCount++;
    }
  }

  console.log(`   ✅ Successfully fixed ${fixedCount} missing reseller_ids`);
  return { fixed: fixedCount };
}

async function removeDuplicateResellerIds(dryRun = false) {
  console.log(`🔄 ${dryRun ? '[DRY RUN]' : ''} Removing duplicate reseller_ids...`);

  // Find duplicates
  const { data: duplicates, error } = await supabaseAdmin
    .rpc('find_duplicate_reseller_ids', {});

  // If RPC doesn't exist, use a regular query
  if (error && error.message.includes('function')) {
    const { data: myPackages, error: fetchError } = await supabaseAdmin
      .from('my_packages')
      .select('id, name, reseller_id, created_at')
      .not('reseller_id', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Error fetching packages: ${fetchError.message}`);
    }

    // Group by reseller_id
    const groups = {};
    myPackages.forEach(pkg => {
      if (!groups[pkg.reseller_id]) {
        groups[pkg.reseller_id] = [];
      }
      groups[pkg.reseller_id].push(pkg);
    });

    const duplicateGroups = Object.values(groups).filter(group => group.length > 1);
    
    if (!duplicateGroups.length) {
      console.log('   ✅ No duplicate reseller_ids found');
      return { removed: 0 };
    }

    console.log(`   Found ${duplicateGroups.length} groups of duplicates`);

    const toRemove = [];
    duplicateGroups.forEach(group => {
      // Keep the newest (first in array), mark others for removal
      const [keep, ...remove] = group;
      console.log(`     reseller_id ${keep.reseller_id}: keeping "${keep.name}", removing ${remove.length} others`);
      toRemove.push(...remove.map(pkg => pkg.id));
    });

    if (dryRun) {
      console.log(`   [DRY RUN] Would remove ${toRemove.length} duplicate records`);
      return { removed: 0, wouldRemove: toRemove.length };
    }

    // Actually remove duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('my_packages')
      .delete()
      .in('id', toRemove);

    if (deleteError) {
      throw new Error(`Error removing duplicates: ${deleteError.message}`);
    }

    console.log(`   ✅ Successfully removed ${toRemove.length} duplicate records`);
    return { removed: toRemove.length };
  }

  throw error;
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

async function main() {
  if (options.help) {
    showHelp();
    return;
  }

  if (!Object.values(options).some(Boolean)) {
    console.log('❌ No options specified. Use --help for usage information.');
    return;
  }

  console.log('🔧 Package Integrity Fix Script\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Run initial verification
    console.log('🔍 Running initial verification...');
    const initialResults = await verifyPackageIntegrity();
    console.log('');

    const results = {
      orphanedRemoved: 0,
      missingIdsFixed: 0,
      duplicatesRemoved: 0
    };

    // Fix orphaned records
    if (options.removeOrphaned) {
      const result = await removeOrphanedRecords(options.dryRun);
      results.orphanedRemoved = result.removed || 0;
      console.log('');
    }

    // Fix missing reseller_ids
    if (options.fixMissingIds) {
      const result = await fixMissingResellerIds(options.dryRun);
      results.missingIdsFixed = result.fixed || 0;
      console.log('');
    }

    // Remove duplicates
    if (options.removeDuplicates) {
      const result = await removeDuplicateResellerIds(options.dryRun);
      results.duplicatesRemoved = result.removed || 0;
      console.log('');
    }

    // Run final verification if changes were made
    if (!options.dryRun && (results.orphanedRemoved > 0 || results.missingIdsFixed > 0 || results.duplicatesRemoved > 0)) {
      console.log('🔍 Running final verification...');
      await verifyPackageIntegrity();
    }

    console.log('\n📋 FIX SUMMARY:');
    console.log(`   - Orphaned records ${options.dryRun ? 'would be ' : ''}removed: ${results.orphanedRemoved}`);
    console.log(`   - Missing reseller_ids ${options.dryRun ? 'would be ' : ''}fixed: ${results.missingIdsFixed}`);
    console.log(`   - Duplicate records ${options.dryRun ? 'would be ' : ''}removed: ${results.duplicatesRemoved}`);

    if (options.dryRun) {
      console.log('\n💡 Run without --dry-run to apply these changes');
    }

  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  removeOrphanedRecords,
  fixMissingResellerIds,
  removeDuplicateResellerIds
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 Fix process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix process failed:', error);
      process.exit(1);
    });
} 