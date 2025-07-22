const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMostPopularPackages() {
  console.log('🔍 CHECKING MOST POPULAR PACKAGES ORDER');
  console.log('='.repeat(50));
  
  try {
    // Get most popular packages in order
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('name, data_amount, days, homepage_order, location_slug, visible, show_on_frontend')
      .eq('location_slug', 'most-popular')
      .eq('visible', true)
      .eq('show_on_frontend', true)
      .order('homepage_order', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`Found ${packages.length} packages in most-popular section:`);
    console.log('');

    packages.forEach((pkg, index) => {
      const isUnlimited = pkg.data_amount === 0;
      const dataDisplay = isUnlimited ? 'UNLIMITED' : `${pkg.data_amount}GB`;
      
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   Data: ${dataDisplay}`);
      console.log(`   Days: ${pkg.days}`);
      console.log(`   Homepage Order: ${pkg.homepage_order}`);
      console.log(`   ${isUnlimited ? '🚀' : '📦'} ${isUnlimited ? 'UNLIMITED PACKAGE' : 'Normal Package'}`);
      console.log('');
    });

    // Check if unlimited packages are at the end
    const unlimitedPackages = packages.filter(p => p.data_amount === 0);
    const lastPackages = packages.slice(-unlimitedPackages.length);
    const unlimitedAtEnd = unlimitedPackages.length > 0 && lastPackages.every(p => p.data_amount === 0);

    console.log('📊 SUMMARY:');
    console.log(`   Normal packages: ${packages.filter(p => p.data_amount > 0).length}`);
    console.log(`   Unlimited packages: ${unlimitedPackages.length}`);
    console.log(`   Unlimited packages at end: ${unlimitedAtEnd ? '✅ YES' : '❌ NO'}`);

    if (!unlimitedAtEnd && unlimitedPackages.length > 0) {
      console.log('');
      console.log('❌ ISSUE: Unlimited packages are NOT at the end!');
      console.log('💡 SOLUTION: Check homepage_order values. Unlimited should have 998.');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkMostPopularPackages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 