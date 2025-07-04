require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Known double-conversion patterns
const CONVERSION_MAP = {
  1024: 1,    // 1GB → 1024MB → incorrectly stored as 1024GB
  3072: 3,    // 3GB → 3072MB → incorrectly stored as 3072GB
  5120: 5,    // 5GB → 5120MB → incorrectly stored as 5120GB
  10240: 10,  // 10GB → 10240MB → incorrectly stored as 10240GB
  15360: 15,  // 15GB → 15360MB → incorrectly stored as 15360GB
  20480: 20,  // 20GB → 20480MB → incorrectly stored as 20480GB
  30720: 30,  // 30GB → 30720MB → incorrectly stored as 30720GB
  51200: 50   // 50GB → 51200MB → incorrectly stored as 51200GB
};

async function findMassiveDataAmounts() {
  try {
    console.log('🔍 MASSIVE DATA AMOUNT BUG DETECTOR');
    console.log('=' .repeat(60));

    // Find all packages with suspicious data amounts (> 100 GB)
    const { data: problematicPackages, error } = await supabase
      .from('my_packages')
      .select('*')
      .gt('data_amount', 100)
      .order('data_amount', { ascending: false });

    if (error) throw error;

    console.log(`📦 Found ${problematicPackages.length} packages with massive data amounts:\n`);

    if (problematicPackages.length === 0) {
      console.log('✅ No packages with massive data amounts found!');
      console.log('All packages have reasonable data amounts (≤ 100 GB).');
      return [];
    }

    // Display problematic packages
    problematicPackages.forEach((pkg, index) => {
      const correctAmount = CONVERSION_MAP[pkg.data_amount];
      
      console.log(`${index + 1}. ${pkg.country_name} - ${pkg.id.substring(0, 8)}...`);
      console.log(`   Name: "${pkg.name}"`);
      console.log(`   ❌ Current: ${pkg.data_amount} GB (${(pkg.data_amount / 1024).toFixed(1)} TB!)`);
      
      if (correctAmount) {
        console.log(`   ✅ Should be: ${correctAmount} GB (known conversion pattern)`);
      } else {
        console.log(`   🤔 Should be: UNKNOWN (manual review needed)`);
      }
      
      console.log(`   Price: $${pkg.sale_price}, Days: ${pkg.days}`);
      console.log('');
    });

    return problematicPackages;

  } catch (error) {
    console.error('❌ Error finding massive data amounts:', error.message);
    throw error;
  }
}

async function fixMassiveDataAmounts(packages, dryRun = true) {
  if (packages.length === 0) {
    console.log('✅ No packages to fix!');
    return;
  }

  console.log(`🔧 ${dryRun ? 'DRY RUN - ' : ''}FIXING MASSIVE DATA AMOUNTS`);
  console.log('=' .repeat(60));

  let fixedCount = 0;
  let manualReviewCount = 0;
  const fixes = [];

  for (const pkg of packages) {
    const correctAmount = CONVERSION_MAP[pkg.data_amount];
    
    if (correctAmount) {
      console.log(`${dryRun ? 'WOULD FIX' : 'FIXING'}: ${pkg.id.substring(0, 8)}... (${pkg.country_name})`);
      console.log(`  "${pkg.name}"`);
      console.log(`  Data: ${pkg.data_amount} GB → ${correctAmount} GB`);

      if (!dryRun) {
        try {
          const { error } = await supabase
            .from('my_packages')
            .update({ 
              data_amount: correctAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', pkg.id);

          if (error) {
            console.log(`  ❌ Error: ${error.message}`);
          } else {
            console.log(`  ✅ Fixed successfully`);
            fixedCount++;
            fixes.push({
              id: pkg.id,
              country: pkg.country_name,
              name: pkg.name,
              oldAmount: pkg.data_amount,
              newAmount: correctAmount
            });
          }
        } catch (error) {
          console.log(`  ❌ Exception: ${error.message}`);
        }
      } else {
        fixedCount++;
      }
    } else {
      console.log(`⚠️  MANUAL REVIEW NEEDED: ${pkg.id.substring(0, 8)}... (${pkg.country_name})`);
      console.log(`  "${pkg.name}"`);
      console.log(`  Data: ${pkg.data_amount} GB (unknown conversion pattern)`);
      manualReviewCount++;
    }
    console.log('');
  }

  console.log('📊 SUMMARY:');
  console.log(`  ${dryRun ? 'Would fix' : 'Fixed'}: ${fixedCount} packages`);
  console.log(`  Manual review needed: ${manualReviewCount} packages`);

  if (!dryRun && fixes.length > 0) {
    console.log('\n📋 APPLIED FIXES:');
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.country} - ${fix.name}: ${fix.oldAmount}GB → ${fix.newAmount}GB`);
    });
  }

  return fixes;
}

async function checkAllCountriesDataRanges() {
  console.log('\n📊 DATA AMOUNT RANGES BY COUNTRY:');
  console.log('=' .repeat(60));

  const { data: packages, error } = await supabase
    .from('my_packages')
    .select('country_name, data_amount')
    .order('country_name');

  if (error) {
    console.error('Error getting country data:', error.message);
    return;
  }

  // Group by country
  const byCountry = {};
  packages.forEach(pkg => {
    if (!byCountry[pkg.country_name]) {
      byCountry[pkg.country_name] = {
        min: pkg.data_amount,
        max: pkg.data_amount,
        count: 0,
        amounts: []
      };
    }
    const country = byCountry[pkg.country_name];
    country.min = Math.min(country.min, pkg.data_amount);
    country.max = Math.max(country.max, pkg.data_amount);
    country.count++;
    country.amounts.push(pkg.data_amount);
  });

  // Sort by max data amount (problematic ones first)
  Object.entries(byCountry)
    .sort((a, b) => b[1].max - a[1].max)
    .forEach(([country, stats]) => {
      const status = stats.max > 100 ? '❌ ISSUE' : '✅ OK';
      console.log(`${status} ${country}:`);
      console.log(`  Range: ${stats.min}GB - ${stats.max}GB (${stats.count} packages)`);
      
      if (stats.max > 100) {
        console.log(`  ⚠️  MAX ${stats.max}GB is suspicious (${(stats.max / 1024).toFixed(1)} TB)`);
      }
      console.log('');
    });
}

async function main() {
  try {
    console.log('🚀 MASSIVE DATA AMOUNT BUG CHECKER & FIXER');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment: Production');
    console.log('=' .repeat(60));

    // Find problematic packages
    const problematicPackages = await findMassiveDataAmounts();

    // Show country overview
    await checkAllCountriesDataRanges();

    // Fix packages if needed
    if (problematicPackages.length > 0) {
      const shouldFix = process.argv.includes('--fix');
      
      if (shouldFix) {
        console.log('\n⚠️  APPLYING FIXES TO PRODUCTION DATABASE...');
        await fixMassiveDataAmounts(problematicPackages, false);
      } else {
        console.log('\n📋 DRY RUN (add --fix to apply changes):');
        await fixMassiveDataAmounts(problematicPackages, true);
        console.log('\n🔧 To apply fixes, run:');
        console.log('node fix_massive_data_amounts.js --fix');
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Massive data amount check completed!');
  console.log('Timestamp:', new Date().toISOString());
}); 