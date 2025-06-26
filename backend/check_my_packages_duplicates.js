const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMyPackagesDuplicates() {
  try {
    console.log('🔍 Checking my_packages table for duplicates...\n');

    // Fetch all packages from my_packages table
    const { data: allPackages, error } = await supabase
      .from('my_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching packages:', error);
      return;
    }

    console.log(`📊 Total packages in my_packages table: ${allPackages.length}`);

    if (allPackages.length === 0) {
      console.log('ℹ️  No packages found in my_packages table');
      return;
    }

    // Check for duplicate IDs
    const duplicateIds = {};
    allPackages.forEach(pkg => {
      if (!duplicateIds[pkg.id]) {
        duplicateIds[pkg.id] = [];
      }
      duplicateIds[pkg.id].push(pkg);
    });

    const actualDuplicateIds = Object.entries(duplicateIds)
      .filter(([id, packages]) => packages.length > 1)
      .reduce((acc, [id, packages]) => {
        acc[id] = packages;
        return acc;
      }, {});

    if (Object.keys(actualDuplicateIds).length > 0) {
      console.log('❌ Found duplicate IDs:');
      Object.entries(actualDuplicateIds).forEach(([id, packages]) => {
        console.log(`   ID: ${id} (${packages.length} duplicates)`);
        packages.forEach((pkg, index) => {
          console.log(`     ${index + 1}. Created: ${pkg.created_at}, Name: ${pkg.name}, Country: ${pkg.country_name}`);
        });
      });
    } else {
      console.log('✅ No duplicate IDs found');
    }

    // Check for duplicate content (same country, data, validity, price)
    const duplicateContent = {};
    allPackages.forEach(pkg => {
      const key = `${pkg.country_name}-${pkg.data_amount}-${pkg.validity_days}-${pkg.sale_price}`;
      if (!duplicateContent[key]) {
        duplicateContent[key] = [];
      }
      duplicateContent[key].push(pkg);
    });

    const actualDuplicateContent = Object.entries(duplicateContent)
      .filter(([key, packages]) => packages.length > 1)
      .reduce((acc, [key, packages]) => {
        acc[key] = packages;
        return acc;
      }, {});

    if (Object.keys(actualDuplicateContent).length > 0) {
      console.log('\n❌ Found duplicate content:');
      Object.entries(actualDuplicateContent).forEach(([key, packages]) => {
        const [country, data, validity, price] = key.split('-');
        console.log(`   Content: ${country} - ${data}MB - ${validity} days - $${price} (${packages.length} duplicates)`);
        packages.forEach((pkg, index) => {
          console.log(`     ${index + 1}. ID: ${pkg.id}, Created: ${pkg.created_at}, Visible: ${pkg.visible}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate content found');
    }

    // Check for Germany specifically
    console.log('\n🇩🇪 Germany packages:');
    const germanyPackages = allPackages.filter(pkg => 
      pkg.country_name === 'Germany' || 
      pkg.country_code === 'DE' ||
      pkg.country_name?.toLowerCase().includes('germany')
    );

    if (germanyPackages.length > 0) {
      console.log(`   Found ${germanyPackages.length} Germany packages:`);
      germanyPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ID: ${pkg.id}`);
        console.log(`      Name: ${pkg.name}`);
        console.log(`      Country: ${pkg.country_name} (${pkg.country_code})`);
        console.log(`      Data: ${pkg.data_amount}MB, Validity: ${pkg.validity_days} days`);
        console.log(`      Price: $${pkg.sale_price}, Visible: ${pkg.visible}`);
        console.log(`      Created: ${pkg.created_at}`);
        console.log(`      Reseller ID: ${pkg.reseller_id}`);
        console.log('');
      });
    } else {
      console.log('   No Germany packages found');
    }

    // Check visible packages
    const visiblePackages = allPackages.filter(pkg => pkg.visible === true);
    console.log(`\n👁️  Visible packages: ${visiblePackages.length}/${allPackages.length}`);

    // Check for packages that might be causing the frontend issue
    console.log('\n🔍 Analyzing potential frontend issues...');
    
    // Check if there are packages with same reseller_id but different IDs
    const resellerIdGroups = {};
    allPackages.forEach(pkg => {
      if (pkg.reseller_id) {
        if (!resellerIdGroups[pkg.reseller_id]) {
          resellerIdGroups[pkg.reseller_id] = [];
        }
        resellerIdGroups[pkg.reseller_id].push(pkg);
      }
    });

    const duplicateResellerIds = Object.entries(resellerIdGroups)
      .filter(([resellerId, packages]) => packages.length > 1)
      .reduce((acc, [resellerId, packages]) => {
        acc[resellerId] = packages;
        return acc;
      }, {});

    if (Object.keys(duplicateResellerIds).length > 0) {
      console.log('⚠️  Found packages with same reseller_id but different IDs:');
      Object.entries(duplicateResellerIds).forEach(([resellerId, packages]) => {
        console.log(`   Reseller ID: ${resellerId} (${packages.length} packages)`);
        packages.forEach((pkg, index) => {
          console.log(`     ${index + 1}. ID: ${pkg.id}, Visible: ${pkg.visible}, Created: ${pkg.created_at}`);
        });
      });
    }

    // Provide recommendations
    console.log('\n📋 Recommendations:');
    if (Object.keys(actualDuplicateIds).length > 0) {
      console.log('1. ❌ Remove duplicate IDs - keep only the most recent one');
    }
    if (Object.keys(actualDuplicateContent).length > 0) {
      console.log('2. ❌ Remove duplicate content - keep only one package per unique combination');
    }
    if (Object.keys(duplicateResellerIds).length > 0) {
      console.log('3. ⚠️  Review packages with same reseller_id - ensure only one is visible');
    }
    
    if (Object.keys(actualDuplicateIds).length === 0 && 
        Object.keys(actualDuplicateContent).length === 0 && 
        Object.keys(duplicateResellerIds).length === 0) {
      console.log('✅ No obvious duplicates found. The issue might be in the frontend query or caching.');
    }

  } catch (error) {
    console.error('❌ Error checking packages:', error);
  }
}

checkMyPackagesDuplicates(); 