require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPackageIdReferences() {
  try {
    console.log('🔧 FIXING PACKAGE ID REFERENCES');
    console.log('=' .repeat(60));
    console.log('Purpose: Update my_packages IDs to match current packages table');
    console.log('Strategy: Match by country_name + data_amount, select best option');
    console.log('Date:', new Date().toISOString());
    console.log('');

    // Get all my_packages entries
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .order('country_name, data_amount');

    if (myPackagesError) throw myPackagesError;

    console.log(`📦 Found ${myPackages.length} entries in my_packages`);
    console.log('');

    const results = {
      fixed: [],
      multipleMatches: [],
      noMatches: [],
      errors: []
    };

    // Process each my_packages entry
    for (const myPackage of myPackages) {
      console.log(`🔍 Processing: ${myPackage.country_name} ${myPackage.data_amount}GB`);
      
      try {
        // Find matching packages in source table
        const { data: matchingPackages, error: matchError } = await supabase
          .from('packages')
          .select('*')
          .eq('country_name', myPackage.country_name)
          .like('data_amount', `${myPackage.data_amount}GB`);

        if (matchError) throw matchError;

        if (matchingPackages.length === 0) {
          console.log(`   ❌ No matches found`);
          results.noMatches.push(myPackage);
          continue;
        }

        if (matchingPackages.length === 1) {
          // Perfect match - update directly
          const matchingPackage = matchingPackages[0];
          await updatePackageId(myPackage, matchingPackage);
          console.log(`   ✅ Perfect match: ${matchingPackage.name}`);
          results.fixed.push({ myPackage, selectedPackage: matchingPackage });
        } else {
          // Multiple matches - select best one
          const bestPackage = selectBestPackage(matchingPackages);
          await updatePackageId(myPackage, bestPackage);
          console.log(`   ⚠️ Multiple matches (${matchingPackages.length}), selected: ${bestPackage.name}`);
          results.multipleMatches.push({ 
            myPackage, 
            selectedPackage: bestPackage, 
            totalMatches: matchingPackages.length 
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ myPackage, error: error.message });
      }
    }

    // Display results
    displayResults(results);

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    throw error;
  }
}

function selectBestPackage(packages) {
  // Selection strategy: 
  // 1. Prefer packages with prices (not null)
  // 2. Among those, select cheapest
  // 3. If no prices, select shortest validity period
  
  const packagesWithPrices = packages.filter(p => p.sale_price !== null);
  
  if (packagesWithPrices.length > 0) {
    // Select cheapest package
    return packagesWithPrices.reduce((best, current) => 
      current.sale_price < best.sale_price ? current : best
    );
  }
  
  // No prices available, select by shortest validity (assuming shorter = better value)
  const withDays = packages.filter(p => p.days !== null);
  if (withDays.length > 0) {
    return withDays.reduce((best, current) => 
      current.days < best.days ? current : best
    );
  }
  
  // Fallback: just pick first one
  return packages[0];
}

async function updatePackageId(myPackage, selectedPackage) {
  const { error } = await supabase
    .from('my_packages')
    .update({ 
      id: selectedPackage.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', myPackage.id);

  if (error) {
    throw new Error(`Failed to update package ${myPackage.id}: ${error.message}`);
  }
}

function displayResults(results) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('=' .repeat(60));

  const total = results.fixed.length + results.multipleMatches.length + results.noMatches.length + results.errors.length;
  console.log(`Total packages processed: ${total}`);
  console.log(`✅ Successfully fixed: ${results.fixed.length + results.multipleMatches.length}`);
  console.log(`❌ No matches found: ${results.noMatches.length}`);
  console.log(`⚠️ Errors: ${results.errors.length}`);
  console.log('');

  if (results.fixed.length > 0) {
    console.log(`✅ PERFECT MATCHES (${results.fixed.length}):`);
    results.fixed.slice(0, 10).forEach(item => {
      console.log(`   ${item.myPackage.country_name} ${item.myPackage.data_amount}GB → ${item.selectedPackage.name}`);
    });
    if (results.fixed.length > 10) {
      console.log(`   ... and ${results.fixed.length - 10} more`);
    }
    console.log('');
  }

  if (results.multipleMatches.length > 0) {
    console.log(`⚠️ MULTIPLE MATCHES RESOLVED (${results.multipleMatches.length}):`);
    results.multipleMatches.slice(0, 10).forEach(item => {
      console.log(`   ${item.myPackage.country_name} ${item.myPackage.data_amount}GB → ${item.selectedPackage.name} (${item.totalMatches} options)`);
    });
    if (results.multipleMatches.length > 10) {
      console.log(`   ... and ${results.multipleMatches.length - 10} more`);
    }
    console.log('');
  }

  if (results.noMatches.length > 0) {
    console.log(`❌ NO MATCHES FOUND (${results.noMatches.length}):`);
    results.noMatches.forEach(pkg => {
      console.log(`   ${pkg.country_name} ${pkg.data_amount}GB - Package will be removed`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log(`⚠️ ERRORS (${results.errors.length}):`);
    results.errors.forEach(item => {
      console.log(`   ${item.myPackage.country_name} ${item.myPackage.data_amount}GB - ${item.error}`);
    });
    console.log('');
  }

  const successRate = ((results.fixed.length + results.multipleMatches.length) / total * 100).toFixed(1);
  console.log(`🎯 SUCCESS RATE: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT! Package references successfully updated.');
  } else if (successRate >= 70) {
    console.log('✅ GOOD! Most packages updated successfully.');
  } else {
    console.log('⚠️ NEEDS ATTENTION! Many packages could not be updated.');
  }
}

async function main() {
  try {
    await fixPackageIdReferences();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Package ID fix completed!');
    console.log('Run your integrity check again to verify results.');
    console.log('Timestamp:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main(); 