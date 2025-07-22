const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixExistingUnlimitedPackages() {
  console.log('🔧 FIXING EXISTING UNLIMITED PACKAGES IN DATABASE');
  console.log('=' * 60);

  try {
    // Step 1: Find all unlimited packages (data_amount = 0)
    console.log('\n1️⃣ Finding unlimited packages...');
    const { data: unlimitedPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('data_amount', 0);

    if (fetchError) {
      console.error('❌ Error fetching unlimited packages:', fetchError.message);
      return;
    }

    console.log(`Found ${unlimitedPackages.length} unlimited packages`);

    if (unlimitedPackages.length === 0) {
      console.log('✅ No unlimited packages found to fix');
      return;
    }

    // Step 2: Show current state
    console.log('\n📋 Current unlimited packages:');
    unlimitedPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   location_slug: ${pkg.location_slug}`);
      console.log(`   homepage_order: ${pkg.homepage_order}`);
      console.log(`   visible: ${pkg.visible}`);
      console.log(`   show_on_frontend: ${pkg.show_on_frontend}`);
      console.log(`   data_amount: ${pkg.data_amount}`);
      console.log(`   days: ${pkg.days}`);
      console.log('');
    });

    // Step 3: Update unlimited packages with correct values
    console.log('2️⃣ Updating unlimited packages...');
    
    for (const pkg of unlimitedPackages) {
      const updates = {
        location_slug: 'most-popular',
        homepage_order: 998,
        visible: true,
        show_on_frontend: true,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('my_packages')
        .update(updates)
        .eq('id', pkg.id);

      if (updateError) {
        console.error(`❌ Error updating package ${pkg.name}:`, updateError.message);
      } else {
        console.log(`✅ Updated: ${pkg.name}`);
        console.log(`   → location_slug: "${pkg.location_slug}" → "most-popular"`);
        console.log(`   → homepage_order: ${pkg.homepage_order} → 998`);
      }
    }

    // Step 4: Verify the changes
    console.log('\n3️⃣ Verifying changes...');
    const { data: updatedPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('data_amount', 0);

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError.message);
      return;
    }

    console.log('\n📋 Updated unlimited packages:');
    updatedPackages.forEach((pkg, index) => {
      const correctSlug = pkg.location_slug === 'most-popular';
      const correctOrder = pkg.homepage_order === 998;
      const correctVisibility = pkg.visible === true && pkg.show_on_frontend === true;

      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ${correctSlug ? '✅' : '❌'} location_slug: ${pkg.location_slug}`);
      console.log(`   ${correctOrder ? '✅' : '❌'} homepage_order: ${pkg.homepage_order}`);
      console.log(`   ${correctVisibility ? '✅' : '❌'} visible: ${pkg.visible}, show_on_frontend: ${pkg.show_on_frontend}`);
      console.log('');
    });

    // Step 5: Check most-popular packages order
    console.log('4️⃣ Checking most-popular packages order...');
    const { data: mostPopularPackages, error: mostPopularError } = await supabase
      .from('my_packages')
      .select('id, name, data_amount, homepage_order')
      .eq('visible', true)
      .eq('show_on_frontend', true)
      .eq('location_slug', 'most-popular')
      .order('homepage_order', { ascending: true });

    if (mostPopularError) {
      console.error('❌ Error fetching most popular packages:', mostPopularError.message);
      return;
    }

    console.log('\n📋 Most Popular packages (in display order):');
    mostPopularPackages.forEach((pkg, index) => {
      const isUnlimited = pkg.data_amount === 0;
      console.log(`${index + 1}. ${pkg.name} (${isUnlimited ? 'UNLIMITED' : pkg.data_amount + 'GB'}) - order: ${pkg.homepage_order}`);
    });

    const unlimitedAtEnd = mostPopularPackages.filter(p => p.data_amount === 0);
    const normalPackages = mostPopularPackages.filter(p => p.data_amount > 0);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Normal packages: ${normalPackages.length}`);
    console.log(`   Unlimited packages: ${unlimitedAtEnd.length}`);
    
    // Check if unlimited packages are at the end
    const lastPackages = mostPopularPackages.slice(-unlimitedAtEnd.length);
    const unlimitedIsLast = lastPackages.every(p => p.data_amount === 0);
    
    if (unlimitedIsLast && unlimitedAtEnd.length > 0) {
      console.log(`   ✅ Unlimited packages are correctly positioned at the END`);
    } else if (unlimitedAtEnd.length > 0) {
      console.log(`   ❌ Unlimited packages are NOT at the end - check homepage_order values`);
    } else {
      console.log(`   ℹ️  No unlimited packages in most-popular section`);
    }

    console.log('\n✅ Fix complete! Changes should be visible in frontend after cache refresh.');

  } catch (error) {
    console.error('💥 Error fixing unlimited packages:', error.message);
  }
}

// Run the fix
fixExistingUnlimitedPackages()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 