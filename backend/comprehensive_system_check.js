const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveSystemCheck() {
  console.log('🔍 COMPREHENSIVE SYSTEM CHECK\n');
  console.log('='.repeat(50));

  // 1. Check Supabase Connection
  console.log('\n1️⃣ CHECKING SUPABASE CONNECTION');
  try {
    const { data, error } = await supabase.from('my_packages').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return;
  }

  // 2. Check Packages Table
  console.log('\n2️⃣ CHECKING PACKAGES TABLE');
  try {
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .limit(5);

    if (packagesError) {
      console.log('❌ Error accessing packages table:', packagesError.message);
    } else {
      console.log(`📊 Packages table has ${packages.length} packages`);
      if (packages.length > 0) {
        console.log('📋 Sample packages:');
        packages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name}`);
          console.log(`      ID: ${pkg.id}`);
          console.log(`      Reseller ID: ${pkg.reseller_id || 'NULL'}`);
          console.log(`      Real Package ID: ${pkg.features?.packageId || 'NULL'}`);
        });
      } else {
        console.log('⚠️  Packages table is EMPTY - this will cause issues!');
      }
    }
  } catch (error) {
    console.log('❌ Error checking packages table:', error.message);
  }

  // 3. Check My Packages Table
  console.log('\n3️⃣ CHECKING MY_PACKAGES TABLE');
  try {
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id, sale_price')
      .limit(5);

    if (myPackagesError) {
      console.log('❌ Error accessing my_packages table:', myPackagesError.message);
    } else {
      console.log(`📊 My_packages table has ${myPackages.length} packages`);
      if (myPackages.length > 0) {
        console.log('📋 Sample my_packages:');
        myPackages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name}`);
          console.log(`      ID: ${pkg.id}`);
          console.log(`      Reseller ID: ${pkg.reseller_id || 'NULL'}`);
          console.log(`      Sale Price: ${pkg.sale_price}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking my_packages table:', error.message);
  }

  // 4. Check Mapping Between Tables
  console.log('\n4️⃣ CHECKING MAPPING BETWEEN TABLES');
  try {
    const { data: myPackagesWithResellerId } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(3);

    if (myPackagesWithResellerId && myPackagesWithResellerId.length > 0) {
      console.log(`🔗 Testing mapping for ${myPackagesWithResellerId.length} my_packages:`);
      
      for (const myPkg of myPackagesWithResellerId) {
        const { data: matchingPackage, error: matchError } = await supabase
          .from('packages')
          .select('id, name, features')
          .eq('reseller_id', myPkg.reseller_id)
          .single();

        if (matchError) {
          console.log(`❌ ${myPkg.name} (${myPkg.reseller_id}) -> NO MATCH FOUND`);
        } else if (matchingPackage) {
          console.log(`✅ ${myPkg.name} (${myPkg.reseller_id}) -> ${matchingPackage.name} (${matchingPackage.features.packageId})`);
        }
      }
    } else {
      console.log('⚠️  No my_packages with reseller_id found');
    }
  } catch (error) {
    console.log('❌ Error checking mapping:', error.message);
  }

  // 5. Check Roamify API
  console.log('\n5️⃣ CHECKING ROAMIFY API');
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.status === 200) {
      const packages = response.data?.data?.packages || [];
      console.log(`✅ Roamify API accessible - ${packages.length} packages available`);
      
      if (packages.length > 0) {
        console.log('📋 Sample Roamify packages:');
        packages.slice(0, 3).forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.package} (${pkg.packageId})`);
        });
      }
    } else {
      console.log(`❌ Roamify API returned status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Roamify API error:', error.response?.status || error.message);
  }

  // 6. Check Backend Deployment
  console.log('\n6️⃣ CHECKING BACKEND DEPLOYMENT');
  try {
    const response = await axios.get('https://esimal.onrender.com/api/health', {
      timeout: 10000,
    });
    
    if (response.status === 200) {
      console.log('✅ Backend is deployed and accessible');
    } else {
      console.log(`⚠️  Backend returned status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
  }

  // 7. Summary and Recommendations
  console.log('\n7️⃣ SUMMARY AND RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  // Check if packages table is empty
  const { data: packageCount } = await supabase
    .from('packages')
    .select('id', { count: 'exact' });

  if (packageCount === 0) {
    console.log('🚨 CRITICAL ISSUE: Packages table is empty!');
    console.log('   → Customers cannot buy real eSIMs');
    console.log('   → All orders will use fallback package');
    console.log('   → Need to populate packages table with real Roamify packages');
    console.log('\n   SOLUTION: Run the sync script with service role key');
  } else {
    console.log('✅ Packages table has data');
  }

  // Check if mapping works
  const { data: myPackages } = await supabase
    .from('my_packages')
    .select('reseller_id')
    .not('reseller_id', 'is', null)
    .limit(1);

  if (myPackages && myPackages.length > 0) {
    const { data: matchingPackage } = await supabase
      .from('packages')
      .select('id')
      .eq('reseller_id', myPackages[0].reseller_id)
      .single();

    if (matchingPackage) {
      console.log('✅ Mapping between my_packages and packages works');
    } else {
      console.log('⚠️  Mapping between my_packages and packages is broken');
    }
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If packages table is empty: Populate it with real Roamify packages');
  console.log('2. If mapping is broken: Fix the reseller_id mapping');
  console.log('3. Test a real purchase on your website');
  console.log('4. Verify customers receive real QR codes and eSIM data');
}

comprehensiveSystemCheck().catch(console.error); 