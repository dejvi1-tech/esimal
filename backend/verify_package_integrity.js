#!/usr/bin/env node

/**
 * Package Integrity Verification Script
 * 
 * This script verifies that all package IDs in my_packages.reseller_id 
 * exist in the packages.id table.
 * 
 * Usage: node verify_package_integrity.js
 */

const { createClient } = require('@supabase/supabase-js');
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

async function verifyPackageIntegrity() {
  console.log('🔍 Starting Package Integrity Verification...\n');

  try {
    // Step 1: Get counts for both tables
    const { count: packagesCount, error: packagesCountError } = await supabaseAdmin
      .from('packages')
      .select('*', { count: 'exact', head: true });

    const { count: myPackagesCount, error: myPackagesCountError } = await supabaseAdmin
      .from('my_packages')
      .select('*', { count: 'exact', head: true });

    if (packagesCountError || myPackagesCountError) {
      throw new Error('Error getting table counts');
    }

    console.log(`📊 Table Statistics:`);
    console.log(`   - packages table: ${packagesCount} records`);
    console.log(`   - my_packages table: ${myPackagesCount} records\n`);

    // Step 2: Get all my_packages with their reseller_ids
    const { data: myPackages, error: myPackagesError } = await supabaseAdmin
      .from('my_packages')
      .select('id, name, reseller_id, country_name')
      .order('created_at', { ascending: false });

    if (myPackagesError) {
      throw new Error(`Error fetching my_packages: ${myPackagesError.message}`);
    }

    console.log(`📦 Analyzing ${myPackages.length} packages from my_packages table...\n`);

    // Step 3: Check for missing reseller_ids
    const packagesWithoutResellerId = myPackages.filter(pkg => !pkg.reseller_id);
    
    if (packagesWithoutResellerId.length > 0) {
      console.log(`⚠️  Found ${packagesWithoutResellerId.length} packages WITHOUT reseller_id:`);
      packagesWithoutResellerId.forEach(pkg => {
        console.log(`   - ID: ${pkg.id} | Name: ${pkg.name} | Country: ${pkg.country_name}`);
      });
      console.log('');
    }

    // Step 4: Get packages with reseller_ids to verify
    const packagesToVerify = myPackages.filter(pkg => pkg.reseller_id);
    console.log(`🔍 Verifying ${packagesToVerify.length} packages with reseller_ids...\n`);

    // Step 5: Collect all unique reseller_ids for batch verification
    const resellerIds = [...new Set(packagesToVerify.map(pkg => pkg.reseller_id))];
    console.log(`📋 Found ${resellerIds.length} unique reseller IDs to verify...\n`);

    // Step 6: Check which reseller_ids exist in packages table
    // We need to convert TEXT to UUID for comparison
    const { data: existingPackages, error: existingError } = await supabaseAdmin
      .from('packages')
      .select('id')
      .in('id', resellerIds);

    if (existingError) {
      throw new Error(`Error checking existing packages: ${existingError.message}`);
    }

    const existingPackageIds = new Set(existingPackages.map(pkg => pkg.id));
    
    // Step 7: Find orphaned records (reseller_ids that don't exist in packages)
    const orphanedPackages = packagesToVerify.filter(pkg => !existingPackageIds.has(pkg.reseller_id));

    // Step 8: Report results
    console.log(`✅ VERIFICATION RESULTS:`);
    console.log(`   - Total my_packages records: ${myPackages.length}`);
    console.log(`   - Records with reseller_id: ${packagesToVerify.length}`);
    console.log(`   - Records without reseller_id: ${packagesWithoutResellerId.length}`);
    console.log(`   - Valid references: ${packagesToVerify.length - orphanedPackages.length}`);
    console.log(`   - Orphaned records: ${orphanedPackages.length}\n`);

    if (orphanedPackages.length > 0) {
      console.log(`❌ ORPHANED PACKAGES (reseller_id not found in packages table):`);
      orphanedPackages.forEach(pkg => {
        console.log(`   - ID: ${pkg.id}`);
        console.log(`     Name: ${pkg.name}`);
        console.log(`     Country: ${pkg.country_name}`);
        console.log(`     Orphaned reseller_id: ${pkg.reseller_id}`);
        console.log('');
      });
    } else {
      console.log(`✅ All package references are valid! No orphaned records found.`);
    }

    // Step 9: Check for duplicate reseller_ids
    const resellerIdCounts = {};
    packagesToVerify.forEach(pkg => {
      resellerIdCounts[pkg.reseller_id] = (resellerIdCounts[pkg.reseller_id] || 0) + 1;
    });

    const duplicates = Object.entries(resellerIdCounts).filter(([id, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  DUPLICATE RESELLER IDS FOUND:`);
      duplicates.forEach(([resellerId, count]) => {
        console.log(`   - reseller_id: ${resellerId} (appears ${count} times)`);
        const duplicatePackages = packagesToVerify.filter(pkg => pkg.reseller_id === resellerId);
        duplicatePackages.forEach(pkg => {
          console.log(`     * ID: ${pkg.id} | Name: ${pkg.name}`);
        });
      });
    } else {
      console.log(`\n✅ No duplicate reseller_ids found.`);
    }

    // Step 10: Summary and recommendations
    console.log(`\n📋 SUMMARY:`);
    console.log(`   - Data integrity: ${orphanedPackages.length === 0 ? '✅ GOOD' : '❌ ISSUES FOUND'}`);
    console.log(`   - Duplicate prevention: ${duplicates.length === 0 ? '✅ GOOD' : '⚠️  DUPLICATES FOUND'}`);
    console.log(`   - Missing reseller_ids: ${packagesWithoutResellerId.length === 0 ? '✅ NONE' : `⚠️  ${packagesWithoutResellerId.length} FOUND`}`);

    if (orphanedPackages.length > 0) {
      console.log(`\n🔧 RECOMMENDED ACTIONS:`);
      console.log(`   1. Review orphaned packages and either:`);
      console.log(`      - Remove them if they're no longer needed`);
      console.log(`      - Update their reseller_id to valid package IDs`);
      console.log(`      - Add corresponding packages to the packages table`);
    }

    if (duplicates.length > 0) {
      console.log(`   2. Review duplicate reseller_ids - each should be unique`);
    }

    if (packagesWithoutResellerId.length > 0) {
      console.log(`   3. Update packages without reseller_id to have proper references`);
    }

    return {
      totalMyPackages: myPackages.length,
      validReferences: packagesToVerify.length - orphanedPackages.length,
      orphanedCount: orphanedPackages.length,
      duplicateCount: duplicates.length,
      missingResellerIdCount: packagesWithoutResellerId.length,
      isHealthy: orphanedPackages.length === 0 && duplicates.length === 0
    };

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { verifyPackageIntegrity };

// Run if called directly
if (require.main === module) {
  verifyPackageIntegrity()
    .then((results) => {
      console.log(`\n🏁 Verification completed.`);
      process.exit(results.isHealthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
} 