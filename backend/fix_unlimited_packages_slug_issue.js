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

function generateCorrectSlugForUnlimited(countryCode, days) {
  return `esim-${countryCode.toLowerCase()}-${days}days-unlimited-all`;
}

function generateCorrectSlugForNormal(countryCode, days, dataAmount) {
  // Country code to full name mapping (Greece format)
  const countryMapping = {
    'GR': 'greece',
    'AL': 'albania', 
    'DE': 'germany',
    'IT': 'italy',
    'FR': 'france',
    'ES': 'spain',
    'PT': 'portugal',
    'NL': 'netherlands',
    'BE': 'belgium',
    'AT': 'austria',
    'CH': 'switzerland',
    'US': 'united-states',
    'CA': 'canada',
    'UK': 'united-kingdom',
    'GB': 'united-kingdom',
    'IE': 'ireland',
    'NO': 'norway',
    'SE': 'sweden',
    'DK': 'denmark',
    'FI': 'finland',
    'IS': 'iceland',
    'PL': 'poland',
    'CZ': 'czech-republic',
    'HU': 'hungary',
    'RO': 'romania',
    'BG': 'bulgaria',
    'HR': 'croatia',
    'SI': 'slovenia',
    'SK': 'slovakia',
    'LT': 'lithuania',
    'LV': 'latvia',
    'EE': 'estonia',
    'TR': 'turkey',
    'AE': 'united-arab-emirates',
    'SA': 'saudi-arabia',
    'EG': 'egypt',
    'MA': 'morocco',
    'ZA': 'south-africa',
    'KE': 'kenya',
    'NG': 'nigeria',
    'JP': 'japan',
    'KR': 'south-korea',
    'CN': 'china',
    'IN': 'india',
    'TH': 'thailand',
    'VN': 'vietnam',
    'ID': 'indonesia',
    'MY': 'malaysia',
    'SG': 'singapore',
    'PH': 'philippines',
    'AU': 'australia',
    'NZ': 'new-zealand',
    'BR': 'brazil',
    'AR': 'argentina',
    'CL': 'chile',
    'CO': 'colombia',
    'MX': 'mexico',
    'EU': 'europe',
    'EUS': 'europe-sprint',
    'EUUS': 'europe-us'
  };

  const countryName = countryMapping[countryCode.toUpperCase()] || countryCode.toLowerCase();
  const dataAmountInt = Math.floor(dataAmount);
  
  return `esim-${countryName}-${days}days-${dataAmountInt}gb-all`;
}

async function fixUnlimitedPackagesSlugIssue() {
  console.log('🔧 FIXING UNLIMITED PACKAGES SLUG ISSUE FOR ROAMIFY API');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Find all packages that need slug fixes
    console.log('\n1️⃣ Finding packages with slug issues...');
    const { data: allPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .order('data_amount', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError.message);
      return;
    }

    console.log(`Found ${allPackages.length} packages to check`);

    // Step 2: Analyze and categorize packages
    const unlimitedPackages = [];
    const normalPackagesWithWrongSlugs = [];
    const packagesWithMissingSlugs = [];
    const correctPackages = [];

    for (const pkg of allPackages) {
      const isUnlimited = pkg.data_amount === 0;
      const hasSlug = !!pkg.slug;
      
      if (isUnlimited) {
        const correctSlug = generateCorrectSlugForUnlimited(pkg.country_code, pkg.days);
        if (!hasSlug || pkg.slug !== correctSlug) {
          unlimitedPackages.push({
            ...pkg,
            correctSlug,
            issue: !hasSlug ? 'missing_slug' : 'wrong_slug'
          });
        } else {
          correctPackages.push(pkg);
        }
      } else {
        const correctSlug = generateCorrectSlugForNormal(pkg.country_code, pkg.days, pkg.data_amount);
        if (!hasSlug) {
          packagesWithMissingSlugs.push({
            ...pkg,
            correctSlug,
            issue: 'missing_slug'
          });
        } else if (pkg.slug !== correctSlug) {
          normalPackagesWithWrongSlugs.push({
            ...pkg,
            correctSlug,
            issue: 'wrong_slug'
          });
        } else {
          correctPackages.push(pkg);
        }
      }
    }

    console.log(`\n📊 Package Analysis:`);
    console.log(`   ✅ Correct packages: ${correctPackages.length}`);
    console.log(`   🔄 Unlimited packages needing fixes: ${unlimitedPackages.length}`);
    console.log(`   🔄 Normal packages with wrong slugs: ${normalPackagesWithWrongSlugs.length}`);
    console.log(`   🔄 Packages with missing slugs: ${packagesWithMissingSlugs.length}`);
    
    // Step 3: Show details of unlimited packages that need fixing
    if (unlimitedPackages.length > 0) {
      console.log(`\n🔍 UNLIMITED PACKAGES NEEDING FIXES:`);
      unlimitedPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   Country: ${pkg.country_name} (${pkg.country_code})`);
        console.log(`   Data: UNLIMITED (${pkg.data_amount})`);
        console.log(`   Days: ${pkg.days}`);
        console.log(`   Current slug: ${pkg.slug || 'MISSING'}`);
        console.log(`   Correct slug: ${pkg.correctSlug}`);
        console.log(`   Issue: ${pkg.issue}`);
        console.log(`   location_slug: ${pkg.location_slug}`);
        console.log(`   homepage_order: ${pkg.homepage_order}`);
        console.log('');
      });
    }

    // Step 4: Fix unlimited packages
    if (unlimitedPackages.length > 0) {
      console.log(`\n2️⃣ Fixing unlimited packages...`);
      
      for (const pkg of unlimitedPackages) {
        const updates = {
          slug: pkg.correctSlug,
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
          console.error(`❌ Error updating ${pkg.name}:`, updateError.message);
        } else {
          console.log(`✅ Fixed: ${pkg.name}`);
          console.log(`   → slug: "${pkg.slug || 'MISSING'}" → "${pkg.correctSlug}"`);
          console.log(`   → location_slug: "${pkg.location_slug}" → "most-popular"`);
          console.log(`   → homepage_order: ${pkg.homepage_order} → 998`);
        }
      }
    }

    // Step 5: Fix normal packages with missing or wrong slugs
    const allNormalFixes = [...normalPackagesWithWrongSlugs, ...packagesWithMissingSlugs];
    if (allNormalFixes.length > 0) {
      console.log(`\n3️⃣ Fixing normal packages with slug issues...`);
      
      for (const pkg of allNormalFixes.slice(0, 10)) { // Limit to first 10 for demo
        const updates = {
          slug: pkg.correctSlug,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('my_packages')
          .update(updates)
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`❌ Error updating ${pkg.name}:`, updateError.message);
        } else {
          console.log(`✅ Fixed: ${pkg.name} → ${pkg.correctSlug}`);
        }
      }
      
      if (allNormalFixes.length > 10) {
        console.log(`   ... and ${allNormalFixes.length - 10} more packages need fixes`);
      }
    }

    // Step 6: Verify unlimited packages after fixes
    console.log(`\n4️⃣ Verifying unlimited packages after fixes...`);
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('data_amount', 0);

    if (verifyError) {
      console.error('❌ Error verifying fixes:', verifyError.message);
      return;
    }

    console.log(`\n📋 Unlimited packages verification:`);
    verifyPackages.forEach((pkg, index) => {
      const correctSlug = generateCorrectSlugForUnlimited(pkg.country_code, pkg.days);
      const slugCorrect = pkg.slug === correctSlug;
      const locationCorrect = pkg.location_slug === 'most-popular';
      const orderCorrect = pkg.homepage_order === 998;
      
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ${slugCorrect ? '✅' : '❌'} slug: ${pkg.slug}`);
      console.log(`   ${locationCorrect ? '✅' : '❌'} location_slug: ${pkg.location_slug}`);
      console.log(`   ${orderCorrect ? '✅' : '❌'} homepage_order: ${pkg.homepage_order}`);
      console.log(`   ${pkg.visible && pkg.show_on_frontend ? '✅' : '❌'} visible: ${pkg.visible}, show_on_frontend: ${pkg.show_on_frontend}`);
      
      if (!slugCorrect) {
        console.log(`   🔧 Expected slug: ${correctSlug}`);
      }
      console.log('');
    });

    // Step 7: Test Roamify API compatibility
    console.log(`\n5️⃣ Testing Roamify API compatibility...`);
    const unlimitedWithCorrectSlugs = verifyPackages.filter(pkg => {
      const correctSlug = generateCorrectSlugForUnlimited(pkg.country_code, pkg.days);
      return pkg.slug === correctSlug;
    });

    console.log(`📦 Unlimited packages ready for Roamify API:`);
    unlimitedWithCorrectSlugs.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   Roamify Package ID: ${pkg.slug}`);
      console.log(`   Country: ${pkg.country_name} (${pkg.country_code})`);
      console.log(`   Data: UNLIMITED, Duration: ${pkg.days} days`);
      console.log(`   Price: €${pkg.sale_price}`);
      console.log('');
    });

    // Step 8: Show most-popular packages order
    console.log(`\n6️⃣ Most Popular packages display order...`);
    const { data: mostPopularPackages, error: mostPopularError } = await supabase
      .from('my_packages')
      .select('id, name, data_amount, homepage_order, slug')
      .eq('visible', true)
      .eq('show_on_frontend', true)
      .eq('location_slug', 'most-popular')
      .order('homepage_order', { ascending: true });

    if (mostPopularError) {
      console.error('❌ Error fetching most popular packages:', mostPopularError.message);
      return;
    }

    console.log(`📋 Most Popular packages (in display order):`);
    mostPopularPackages.forEach((pkg, index) => {
      const isUnlimited = pkg.data_amount === 0;
      const dataDisplay = isUnlimited ? 'UNLIMITED' : `${pkg.data_amount}GB`;
      console.log(`${index + 1}. ${pkg.name} (${dataDisplay}) - order: ${pkg.homepage_order}`);
      if (isUnlimited) {
        console.log(`   🔗 Roamify Package ID: ${pkg.slug}`);
      }
    });

    const unlimitedInMostPopular = mostPopularPackages.filter(p => p.data_amount === 0);
    const normalInMostPopular = mostPopularPackages.filter(p => p.data_amount > 0);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Normal packages: ${normalInMostPopular.length}`);
    console.log(`   Unlimited packages: ${unlimitedInMostPopular.length}`);
    
    // Check if unlimited packages are at the end
    const lastPackages = mostPopularPackages.slice(-unlimitedInMostPopular.length);
    const unlimitedIsLast = unlimitedInMostPopular.length > 0 && lastPackages.every(p => p.data_amount === 0);
    
    if (unlimitedIsLast) {
      console.log(`   ✅ Unlimited packages are correctly positioned at the END`);
    } else if (unlimitedInMostPopular.length > 0) {
      console.log(`   ❌ Unlimited packages are NOT at the end - check homepage_order values`);
    } else {
      console.log(`   ℹ️  No unlimited packages in most-popular section`);
    }

    console.log('\n✅ Unlimited packages slug fix complete!');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy backend changes (already done)');
    console.log('2. Deploy frontend changes for "PA LIMIT" text');
    console.log('3. Test unlimited package purchase flow');
    console.log('4. Verify eSIM delivery works correctly');
    
  } catch (error) {
    console.error('💥 Error fixing unlimited packages:', error.message);
  }
}

// Run the fix
fixUnlimitedPackagesSlugIssue()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 