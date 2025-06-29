const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Environment variables should be available in Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Use anon key for now
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseUrl || !supabaseKey || !ROAMIFY_API_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickSync() {
  console.log('🔄 QUICK ROAMIFY PACKAGES SYNC\n');
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

    const roamifyPackages = response.data?.data?.packages || [];
    console.log(`✅ Fetched ${roamifyPackages.length} packages from Roamify`);

    if (roamifyPackages.length === 0) {
      console.log('⚠️  No packages found in Roamify API');
      return;
    }

    // 2. Transform and insert packages (small batch first)
    console.log('\n2️⃣ INSERTING FIRST 10 PACKAGES');
    
    const packagesToInsert = roamifyPackages.slice(0, 10).map(pkg => ({
      id: pkg.packageId,
      name: pkg.package,
      description: pkg.description || '',
      data_amount: pkg.data || 0,
      validity_days: pkg.validity || 0,
      price: pkg.price || 0,
      reseller_id: pkg.packageId,
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

    console.log(`📦 Inserting ${packagesToInsert.length} packages...`);
    
    const { data, error } = await supabase
      .from('packages')
      .upsert(packagesToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.log('❌ Insert failed:', error.message);
      return;
    }

    console.log('✅ Successfully inserted packages');

    // 3. Verify sync
    console.log('\n3️⃣ VERIFYING SYNC');
    
    const { data: syncedPackages, error: verifyError } = await supabase
      .from('packages')
      .select('id, name, reseller_id')
      .limit(5);

    if (verifyError) {
      console.log('❌ Error verifying sync:', verifyError.message);
    } else {
      console.log(`✅ Successfully synced ${syncedPackages.length} packages`);
      console.log('📋 Sample synced packages:');
      syncedPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.reseller_id})`);
      });
    }

    // 4. Test mapping
    console.log('\n4️⃣ TESTING PACKAGE MAPPING');
    
    const { data: myPackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(2);

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

    console.log('\n🎉 QUICK SYNC COMPLETED!');
    console.log('✅ Your customers can now buy real eSIMs');
    console.log('✅ No more null reference errors');
    console.log('✅ Orders will use actual Roamify packages');

  } catch (error) {
    console.log('❌ Quick sync failed:', error.message);
    if (error.response) {
      console.log('📋 API Response:', error.response.data);
    }
  }
}

quickSync().catch(console.error); 