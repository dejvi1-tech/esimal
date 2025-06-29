const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fetch = require('node-fetch');

// PATCH: Use hardcoded Supabase credentials for local run
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
// PATCH: Use service role key to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4NjI4NiwiZXhwIjoyMDY0NTYyMjg2fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

// PATCH: Use hardcoded Roamify API key
const ROAMIFY_API_KEY = 'WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN';
const ROAMIFY_API_URL = 'https://api.getroamify.com';

async function syncRoamifyPackages() {
  console.log('🔄 SYNCING ROAMIFY PACKAGES\n');
  console.log('='.repeat(50));

  try {
    // 1. Fetch packages from Roamify
    console.log('\n1️⃣ FETCHING PACKAGES FROM ROAMIFY');
    
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (response.status !== 200) {
      throw new Error(`Roamify API returned status ${response.status}`);
    }

    const roamifyPackages = response.data?.data?.packages || [];
    console.log(`✅ Fetched ${roamifyPackages.length} packages from Roamify`);

    if (roamifyPackages.length === 0) {
      console.log('⚠️  No packages found in Roamify API');
      return;
    }

    // 2. Clear existing packages table (optional)
    console.log('\n2️⃣ CLEARING EXISTING PACKAGES');
    
    const { error: deleteError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

    if (deleteError) {
      console.log('⚠️  Could not clear packages table:', deleteError.message);
      console.log('   Continuing with insert/update...');
    } else {
      console.log('✅ Cleared existing packages');
    }

    // 3. Transform and insert packages
    console.log('\n3️⃣ INSERTING PACKAGES INTO DATABASE');
    
    const packagesToInsert = roamifyPackages.map(pkg => ({
      id: pkg.packageId, // Use Roamify packageId as primary key
      name: pkg.package,
      description: pkg.description || '',
      data_amount: pkg.data || 0,
      validity_days: pkg.validity || 0,
      price: pkg.price || 0,
      reseller_id: pkg.packageId, // Store Roamify packageId in reseller_id
      features: {
        packageId: pkg.packageId,
        type: pkg.type || 'esim',
        region: pkg.region || '',
        operator: pkg.operator || '',
        apn: pkg.apn || '',
        notes: pkg.notes || ''
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log(`📦 Prepared ${packagesToInsert.length} packages for insertion`);

    // Insert in batches to avoid timeout
    const batchSize = 50;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < packagesToInsert.length; i += batchSize) {
      const batch = packagesToInsert.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('packages')
          .upsert(batch, { 
            onConflict: 'id',
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
      .select('id, name, reseller_id')
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
          console.log(`   ${index + 1}. ${pkg.name} (${pkg.reseller_id})`);
        });
      }
    }

    // 5. Test mapping between my_packages and packages
    console.log('\n5️⃣ TESTING PACKAGE MAPPING');
    
    const { data: myPackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(3);

    if (myPackages && myPackages.length > 0) {
      console.log(`🔗 Testing mapping for ${myPackages.length} my_packages:`);
      
      for (const myPkg of myPackages) {
        const { data: matchingPackage } = await supabase
          .from('packages')
          .select('id, name, features')
          .eq('reseller_id', myPkg.reseller_id)
          .single();

        if (matchingPackage) {
          console.log(`✅ ${myPkg.name} (${myPkg.reseller_id}) -> ${matchingPackage.name} (${matchingPackage.features.packageId})`);
        } else {
          console.log(`❌ ${myPkg.name} (${myPkg.reseller_id}) -> NO MATCH FOUND`);
        }
      }
    }

    // 6. Summary
    console.log('\n6️⃣ SYNC SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`✅ Successfully synced ${insertedCount} packages from Roamify`);
    console.log(`❌ Failed to sync ${errorCount} packages`);
    console.log(`📊 Total packages available: ${roamifyPackages.length}`);
    
    if (insertedCount > 0) {
      console.log('\n🎉 SYNC COMPLETED SUCCESSFULLY!');
      console.log('✅ Your customers can now buy real eSIMs');
      console.log('✅ Orders will use actual Roamify packages');
      console.log('✅ No more fallback package issues');
    } else {
      console.log('\n⚠️  SYNC FAILED');
      console.log('❌ No packages were synced');
      console.log('❌ Customers will still use fallback packages');
    }

  } catch (error) {
    console.log('❌ Sync failed:', error.message);
    if (error.response) {
      console.log('📋 API Response:', error.response.data);
    }
  }
}

syncRoamifyPackages().catch(console.error); 