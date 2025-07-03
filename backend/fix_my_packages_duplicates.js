const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMyPackagesDuplicates() {
  try {
    console.log('🔧 Fixing duplicate packages in my_packages table...\n');

    // Fetch all packages from my_packages table
    const { data: allPackages, error } = await supabase
      .from('my_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching packages:', error);
      return;
    }

    console.log(`📊 Total packages before cleanup: ${allPackages.length}`);

    // Group packages by content (country, data, validity_days, price)
    const contentGroups = {};
    allPackages.forEach(pkg => {
      const key = `${pkg.country_name}-${pkg.data_amount}-${pkg.validity_days}-${pkg.sale_price}`;
      if (!contentGroups[key]) {
        contentGroups[key] = [];
      }
      contentGroups[key].push(pkg);
    });

    // Find groups with duplicates
    const duplicateGroups = Object.entries(contentGroups)
      .filter(([key, packages]) => packages.length > 1)
      .reduce((acc, [key, packages]) => {
        acc[key] = packages;
        return acc;
      }, {});

    if (Object.keys(duplicateGroups).length === 0) {
      console.log('✅ No duplicates found to fix');
      return;
    }

    console.log(`🔍 Found ${Object.keys(duplicateGroups).length} groups with duplicates`);

    // Prepare to delete older duplicates
    const packagesToDelete = [];
    const packagesToKeep = [];

    Object.entries(duplicateGroups).forEach(([contentKey, packages]) => {
      // Sort by created_at (newest first)
      const sortedPackages = packages.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Keep the newest one, mark others for deletion
      const [newestPackage, ...olderPackages] = sortedPackages;
      packagesToKeep.push(newestPackage);
      packagesToDelete.push(...olderPackages);

      console.log(`\n📦 Content: ${contentKey}`);
      console.log(`   ✅ Keeping: ${newestPackage.id} (created: ${newestPackage.created_at})`);
      olderPackages.forEach(pkg => {
        console.log(`   ❌ Deleting: ${pkg.id} (created: ${pkg.created_at})`);
      });
    });

    if (packagesToDelete.length === 0) {
      console.log('✅ No packages to delete');
      return;
    }

    console.log(`\n🗑️  About to delete ${packagesToDelete.length} duplicate packages...`);
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Do you want to proceed with deletion? (y/N): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Deletion cancelled');
      return;
    }

    // Delete the duplicate packages
    const packageIdsToDelete = packagesToDelete.map(pkg => pkg.id);
    
    console.log('\n🗑️  Deleting duplicate packages...');
    const { error: deleteError } = await supabase
      .from('my_packages')
      .delete()
      .in('id', packageIdsToDelete);

    if (deleteError) {
      console.error('❌ Error deleting packages:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${packagesToDelete.length} duplicate packages`);

    // Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remainingPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return;
    }

    console.log(`📊 Total packages after cleanup: ${remainingPackages.length}`);
    console.log(`📉 Removed ${allPackages.length - remainingPackages.length} duplicate packages`);

    // Check for Germany packages specifically
    const germanyPackages = remainingPackages.filter(pkg => 
      pkg.country_name === 'Germany' || 
      pkg.country_code === 'DE' ||
      pkg.country_name?.toLowerCase().includes('germany')
    );

    console.log(`\n🇩🇪 Germany packages after cleanup: ${germanyPackages.length}`);
    germanyPackages.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name} - ${pkg.data_amount}MB - ${pkg.validity_days} days - $${pkg.sale_price}`);
    });

    // Check for any remaining duplicates
    const remainingContentGroups = {};
    remainingPackages.forEach(pkg => {
      const key = `${pkg.country_name}-${pkg.data_amount}-${pkg.validity_days}-${pkg.sale_price}`;
      if (!remainingContentGroups[key]) {
        remainingContentGroups[key] = [];
      }
      remainingContentGroups[key].push(pkg);
    });

    const remainingDuplicates = Object.entries(remainingContentGroups)
      .filter(([key, packages]) => packages.length > 1);

    if (remainingDuplicates.length > 0) {
      console.log(`\n⚠️  Still found ${remainingDuplicates.length} groups with duplicates:`);
      remainingDuplicates.forEach(([key, packages]) => {
        console.log(`   ${key}: ${packages.length} packages`);
      });
    } else {
      console.log('\n✅ No remaining duplicates found!');
    }

    console.log('\n🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing packages:', error);
  }
}

fixMyPackagesDuplicates(); 