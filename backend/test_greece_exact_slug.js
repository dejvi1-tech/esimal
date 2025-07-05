const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGreeceExactSlug() {
  console.log('🧪 Testing Greece exact slug implementation...\n');

  try {
    // Step 1: Check if Greece packages have exact slugs
    console.log('1️⃣ Checking Greece packages in my_packages table...');
    
    const { data: greecePackages, error: greeceError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, days, slug')
      .eq('country_name', 'Greece')
      .order('data_amount', { ascending: true });

    if (greeceError) {
      console.error('❌ Error fetching Greece packages:', greeceError);
      return;
    }

    if (!greecePackages || greecePackages.length === 0) {
      console.log('⚠️ No Greece packages found in my_packages table');
      console.log('   This means the sync script needs to be run first');
      return;
    }

    console.log(`✅ Found ${greecePackages.length} Greece packages:`);
    greecePackages.forEach(pkg => {
      console.log(`   📦 ${pkg.name} (${pkg.data_amount}GB, ${pkg.days} days)`);
      console.log(`      Slug: ${pkg.slug || '❌ MISSING'}`);
    });

    // Step 2: Find the specific 1GB 30-day package for Greece
    console.log('\n2️⃣ Looking for Greece 1GB 30-day package...');
    
    const targetPackage = greecePackages.find(pkg => 
      pkg.data_amount === 1 && pkg.days === 30
    );

    if (!targetPackage) {
      console.log('❌ Greece 1GB 30-day package not found');
      console.log('   Available packages:');
      greecePackages.forEach(pkg => {
        console.log(`   - ${pkg.data_amount}GB ${pkg.days} days`);
      });
      return;
    }

    console.log(`✅ Found target package: ${targetPackage.name}`);
    console.log(`   Slug: ${targetPackage.slug}`);

    // Step 3: Verify the slug format
    console.log('\n3️⃣ Verifying slug format...');
    
    if (!targetPackage.slug) {
      console.log('❌ Package has no slug - sync script needs to be updated');
      return;
    }

    const expectedSlug = 'esim-greece-30days-1gb-all';
    if (targetPackage.slug === expectedSlug) {
      console.log(`✅ Slug matches expected format: ${targetPackage.slug}`);
    } else {
      console.log(`⚠️ Slug format differs:`);
      console.log(`   Expected: ${expectedSlug}`);
      console.log(`   Actual:   ${targetPackage.slug}`);
    }

    // Step 4: Test the exact slug in a mock order payload
    console.log('\n4️⃣ Testing exact slug in V2 API payload...');
    
    const mockPayload = {
      items: [
        {
          packageId: targetPackage.slug,
          quantity: 1
        }
      ]
    };

    console.log('📦 Mock V2 API Payload:');
    console.log(JSON.stringify(mockPayload, null, 2));

    // Step 5: Check if this would work with the updated webhook logic
    console.log('\n5️⃣ Simulating webhook logic...');
    
    // Simulate the exact logic from deliverEsim function
    if (!targetPackage.slug) {
      console.log('❌ Webhook would fail: No slug found');
    } else {
      console.log('✅ Webhook would succeed: Using exact Roamify slug');
      console.log(`   📦 Using slug for Roamify V2 API: ${targetPackage.slug}`);
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Greece packages found: ${greecePackages.length}`);
    console.log(`   - Target package (1GB 30 days): ${targetPackage ? '✅ Found' : '❌ Not found'}`);
    console.log(`   - Slug present: ${targetPackage?.slug ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Slug format: ${targetPackage?.slug || 'N/A'}`);
    console.log(`   - V2 API ready: ${targetPackage?.slug ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGreeceExactSlug(); 