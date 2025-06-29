const { createClient } = require('@supabase/supabase-js');

// You'll need to provide these values
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual key

console.log('🔍 SIMPLE SYSTEM CHECK\n');
console.log('='.repeat(50));

console.log('\n⚠️  NOTE: This script requires manual configuration.');
console.log('Please update the supabaseUrl and supabaseKey variables at the top of this file.');
console.log('You can find these values in your Supabase dashboard.');

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key') {
  console.log('\n❌ Please configure the Supabase credentials first.');
  console.log('Edit this file and replace the placeholder values with your actual credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleSystemCheck() {
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

  // 5. Summary
  console.log('\n5️⃣ SUMMARY');
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
  } else {
    console.log('✅ Packages table has data');
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If packages table is empty: Populate it with real Roamify packages');
  console.log('2. If mapping is broken: Fix the reseller_id mapping');
  console.log('3. Test a real purchase on your website');
  console.log('4. Verify customers receive real QR codes and eSIM data');
}

simpleSystemCheck().catch(console.error); 