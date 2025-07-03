const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY || "WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN";
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Please provide the service role key to bypass RLS policies');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncPackagesWithServiceRole() {
  console.log('🔧 SYNCING PACKAGES WITH SERVICE ROLE\n');
  console.log('='.repeat(60));

  try {
    // 1. Check current system status
    console.log('\n1️⃣ CHECKING CURRENT SYSTEM STATUS');
    
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, roamify_package_id')
      .limit(5);

    if (packagesError) {
      console.log('❌ Error accessing packages table:', packagesError.message);
    } else {
      console.log(`📊 Packages table has ${packages.length} packages`);
      if (packages.length === 0) {
        console.log('⚠️  Packages table is EMPTY - need to sync');
      } else {
        console.log('✅ Packages table has data');
        packages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name} (${pkg.roamify_package_id})`);
        });
      }
    }

    // 2. Fetch packages from Roamify
    console.log('\n2️⃣ FETCHING PACKAGES FROM ROAMIFY');
    
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const roamifyPackages = response.data?.data?.packages || [];
    console.log(`✅ Fetched ${roamifyPackages.length} countries from Roamify`);

    // Flatten all packages from all countries
    const allPackages = roamifyPackages.reduce((acc, country) => {
      if (country.packages && Array.isArray(country.packages)) {
        return acc.concat(country.packages);
      }
      return acc;
    }, []);
    
    console.log(`📦 Extracted ${allPackages.length} packages from ${roamifyPackages.length} countries`);

    // Debug: print first 5 raw packages
    allPackages.slice(0, 5).forEach((pkg, idx) => {
      console.log(`\n[DEBUG] Raw package #${idx + 1}:`);
      console.dir(pkg, { depth: null });
    });

    if (allPackages.length === 0) {
      console.log('⚠️  No packages found in Roamify API');
      return;
    }

    if (allPackages.length > 0) {
      console.log(`[DEBUG] Keys of first element: ${Object.keys(allPackages[0])}`);
      console.log(`[DEBUG] typeof allPackages[0]: ${typeof allPackages[0]}`);
      for (let i = 0; i < Math.min(5, allPackages.length); i++) {
        const pid = allPackages[i].packageId;
        console.log(`[DEBUG] allPackages[${i}].packageId:`, pid, '| type:', typeof pid, '| length:', pid && pid.length);
      }
    }

    // Move filter and debug output here
    console.log('[DEBUG] About to filter validPackages...');
    const validPackages = allPackages.filter(pkg => String(pkg.packageId).trim().length > 0);
    console.log('[DEBUG] After filter. validPackages.length:', validPackages.length);
    console.log(`[DEBUG] Count of packages with non-empty packageId: ${validPackages.length}`);
    console.log(`📦 Found ${validPackages.length} packages with valid packageId (filtered out ${allPackages.length - validPackages.length} invalid packages)`);

    if (validPackages.length === 0) {
      console.log('❌ No valid packages found after filtering');
      return;
    }

    // 3. Clear and sync packages table
    console.log('\n3️⃣ SYNCING PACKAGES TABLE (WITH SERVICE ROLE)');
    
    // Clear existing packages
    const { error: deleteError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.log('⚠️  Could not clear packages table:', deleteError.message);
    } else {
      console.log('✅ Cleared existing packages');
    }

    // Transform and insert packages
    const packagesToInsert = validPackages.map(pkg => ({
      id: uuidv4(), // Generate a new UUID for internal use
      roamify_package_id: pkg.packageId, // Store the real Roamify packageId
      name: pkg.package || 'Unknown Package',
      description: pkg.description || '',
      data_amount: pkg.dataAmount || pkg.data || 0,
      validity_days: pkg.validity || 0,
      price: pkg.price || 0,
      reseller_id: pkg.packageId, // For backward compatibility
      features: {
        packageId: pkg.packageId,
        type: pkg.type || pkg.plan || 'esim',
        region: pkg.region || '',
        operator: pkg.operator || '',
        apn: pkg.apn || '',
        notes: pkg.notes || ''
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`📦 Inserting ${packagesToInsert.length} valid packages...`);
    
    // Insert in batches
    const batchSize = 50;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packagesToInsert.length; i += batchSize) {
      const batch = packagesToInsert.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('packages')
          .upsert(batch, { 
            onConflict: 'roamify_package_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
          errorCount += batch.length;
        } else {
          insertedCount += batch.length;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${batch.length} packages`);
        }
      } catch (batchError) {
        console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, batchError.message);
        errorCount += batch.length;
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Verify sync results
    console.log('\n4️⃣ VERIFYING SYNC RESULTS');
    
    const { data: syncedPackages, error: verifyError } = await supabase
      .from('packages')
      .select('id, name, roamify_package_id')
      .limit(10);

    if (verifyError) {
      console.log('❌ Error verifying sync:', verifyError.message);
    } else {
      console.log(`✅ Successfully synced ${insertedCount} packages`);
      console.log(`❌ Failed to sync ${errorCount} packages`);
      console.log(`📊 Total packages in database: ${syncedPackages.length}`);
      
      if (syncedPackages.length > 0) {
        console.log('📋 Sample synced packages:');
        syncedPackages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name} (${pkg.roamify_package_id})`);
        });
      }
    }

    // 5. Test package mapping
    console.log('\n5️⃣ TESTING PACKAGE MAPPING');
    
    const { data: myPackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(5);

    if (myPackages && myPackages.length > 0) {
      console.log(`🔗 Testing mapping for ${myPackages.length} my_packages:`);
      
      let mappingSuccess = 0;
      for (const myPkg of myPackages) {
        const { data: matchingPackage } = await supabase
          .from('packages')
          .select('id, name, features')
          .eq('roamify_package_id', myPkg.reseller_id)
          .single();

        if (matchingPackage) {
          console.log(`✅ ${myPkg.name} (${myPkg.reseller_id}) -> ${matchingPackage.name} (${matchingPackage.features.packageId})`);
          mappingSuccess++;
        } else {
          console.log(`❌ ${myPkg.name} (${myPkg.reseller_id}) -> NO MATCH FOUND`);
        }
      }
      console.log(`📊 Mapping success rate: ${mappingSuccess}/${myPackages.length} (${Math.round(mappingSuccess/myPackages.length*100)}%)`);
    }

    // 6. Find some Europe/US packages for testing
    console.log('\n6️⃣ FINDING EUROPE/US PACKAGES FOR TESTING');
    
    const { data: europeUsPackages } = await supabase
      .from('packages')
      .select('id, name, roamify_package_id, features')
      .or('name.ilike.%europe%,name.ilike.%us%,name.ilike.%united states%')
      .limit(5);

    if (europeUsPackages && europeUsPackages.length > 0) {
      console.log(`🌍 Found ${europeUsPackages.length} Europe/US packages:`);
      europeUsPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.roamify_package_id})`);
      });
    } else {
      console.log('⚠️  No Europe/US packages found');
    }

    console.log('\n🎉 PACKAGE SYNC COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully synced ${insertedCount} packages from Roamify`);
    console.log(`❌ Failed to sync ${errorCount} packages`);
    console.log(`📊 Total packages available: ${insertedCount + errorCount}`);

    if (insertedCount > 0) {
      console.log('✅ System is now ready for real eSIM orders');
      console.log('✅ Customers will receive real Roamify packages');
    } else {
      console.log('❌ No packages were synced');
      console.log('❌ Customers will still use fallback packages');
    }

  } catch (error) {
    console.error('❌ Error during package sync:', error.message);
    console.error(error.stack);
  }
}

syncPackagesWithServiceRole(); 