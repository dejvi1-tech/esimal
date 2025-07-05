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

// Test if a slug works with Roamify API
async function testSlugWithRoamify(slug) {
  const testPayload = {
    items: [
      {
        packageId: slug,
        quantity: 1
      }
    ]
  };

  try {
    const response = await axios.post(`${ROAMIFY_API_URL}/api/esim/order`, testPayload, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      },
      timeout: 10000, // Shorter timeout for testing
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

async function globalPackageSlugFix() {
  console.log('🌍 Global Package Slug Fix - Comprehensive Solution\n');

  try {
    // Step 1: Get all packages from my_packages table
    console.log('📦 Step 1: Fetching all packages from my_packages table...');
    const { data: allPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .order('country_name', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    console.log(`✅ Found ${allPackages.length} packages in my_packages table`);

    // Step 2: Analyze current state
    console.log('\n📊 Step 2: Analyzing current package state...');
    const packagesWithSlugs = allPackages.filter(pkg => pkg.slug);
    const packagesWithoutSlugs = allPackages.filter(pkg => !pkg.slug);
    const packagesWithIncorrectSlugs = [];

    console.log(`   - Packages with slugs: ${packagesWithSlugs.length}`);
    console.log(`   - Packages without slugs: ${packagesWithoutSlugs.length}`);

    // Step 3: Generate standardized slugs for all packages
    console.log('\n🔧 Step 3: Generating standardized slugs...');
    const packagesToUpdate = [];

    for (const package of allPackages) {
      const standardSlug = generateStandardSlug(package);
      
      if (!standardSlug) {
        console.log(`   ⚠️ Could not generate slug for package: ${package.name} (${package.country_name})`);
        continue;
      }

      const needsUpdate = !package.slug || package.slug !== standardSlug;
      
      if (needsUpdate) {
        packagesToUpdate.push({
          ...package,
          newSlug: standardSlug,
          reason: !package.slug ? 'Missing slug' : 'Incorrect format'
        });
      }
    }

    console.log(`   - Packages that need updates: ${packagesToUpdate.length}`);

    // Step 4: Test slugs with Roamify API (sample testing)
    console.log('\n🧪 Step 4: Testing slugs with Roamify API...');
    const testResults = [];
    const testSample = packagesToUpdate.slice(0, 5); // Test first 5 packages

    for (const package of testSample) {
      console.log(`   Testing: ${package.newSlug} (${package.name})`);
      const testResult = await testSlugWithRoamify(package.newSlug);
      testResults.push({
        package: package,
        slug: package.newSlug,
        testResult: testResult
      });

      if (testResult.success) {
        console.log(`   ✅ SUCCESS: ${package.newSlug}`);
      } else {
        console.log(`   ❌ FAILED: ${package.newSlug} (${testResult.status})`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 5: Calculate success rate
    const successfulTests = testResults.filter(r => r.testResult.success).length;
    const successRate = (successfulTests / testResults.length) * 100;

    console.log(`\n📈 Test Results: ${successfulTests}/${testResults.length} successful (${successRate.toFixed(1)}%)`);

    if (successRate < 80) {
      console.log('⚠️ Low success rate - proceeding with caution');
    }

    // Step 6: Update database with standardized slugs
    console.log('\n💾 Step 6: Updating database with standardized slugs...');
    let updateCount = 0;
    let errorCount = 0;

    for (const package of packagesToUpdate) {
      try {
        const { data: updatedPackage, error: updateError } = await supabase
          .from('my_packages')
          .update({ 
            slug: package.newSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', package.id)
          .select()
          .single();

        if (updateError) {
          console.error(`   ❌ Error updating ${package.name}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Updated: ${package.name} -> ${package.newSlug}`);
          updateCount++;
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ❌ Exception updating ${package.name}:`, error);
        errorCount++;
      }
    }

    // Step 7: Also update packages table if needed
    console.log('\n📦 Step 7: Checking packages table...');
    const { data: packagesTableData, error: packagesTableError } = await supabase
      .from('packages')
      .select('*')
      .order('country_name', { ascending: true });

    let packagesTableUpdateCount = 0;
    if (packagesTableError) {
      console.error('❌ Error fetching from packages table:', packagesTableError);
    } else {
      console.log(`   Found ${packagesTableData.length} packages in packages table`);
      
      // Update packages table with same logic
      for (const package of packagesTableData) {
        const standardSlug = generateStandardSlug(package);
        if (standardSlug && (!package.slug || package.slug !== standardSlug)) {
          try {
            await supabase
              .from('packages')
              .update({ 
                slug: standardSlug,
                updated_at: new Date().toISOString()
              })
              .eq('id', package.id);
            
            packagesTableUpdateCount++;
          } catch (error) {
            console.error(`   ❌ Error updating packages table for ${package.name}:`, error);
          }
        }
      }
      console.log(`   Updated ${packagesTableUpdateCount} packages in packages table`);
    }

    // Step 8: Final verification
    console.log('\n🔍 Step 8: Final verification...');
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('my_packages')
      .select('id, name, slug, country_name, data_amount, days')
      .order('country_name', { ascending: true });

    if (finalCheckError) {
      console.error('❌ Error in final verification:', finalCheckError);
    } else {
      const packagesStillWithoutSlugs = finalCheck.filter(pkg => !pkg.slug);
      console.log(`   - Packages still without slugs: ${packagesStillWithoutSlugs.length}`);
      
      if (packagesStillWithoutSlugs.length > 0) {
        console.log('   ⚠️ Some packages still missing slugs:');
        packagesStillWithoutSlugs.forEach(pkg => {
          console.log(`     - ${pkg.name} (${pkg.country_name})`);
        });
      }
    }

    // Summary
    console.log('\n📋 GLOBAL FIX SUMMARY:');
    console.log(`✅ Total packages processed: ${allPackages.length}`);
    console.log(`✅ Packages updated: ${updateCount}`);
    console.log(`❌ Update errors: ${errorCount}`);
    console.log(`🧪 Test success rate: ${successRate.toFixed(1)}%`);
    console.log(`📦 Packages table updated: ${packagesTableUpdateCount || 0} packages`);
    
    console.log('\n🎯 Standardized Format: esim-{country}-{days}days-{data}gb-all');
    console.log('   Examples:');
    console.log('   - esim-greece-30days-1gb-all');
    console.log('   - esim-albania-30days-3gb-all');
    console.log('   - esim-germany-15days-5gb-all');
    
    console.log('\n🔒 Future Prevention:');
    console.log('   - All new packages will use this standardized format');
    console.log('   - Regular validation can be implemented');
    console.log('   - API testing can catch issues early');

  } catch (error) {
    console.error('❌ Global fix failed:', error);
  }
}

// Run the global fix
globalPackageSlugFix().catch(console.error); 