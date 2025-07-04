require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllMismatches() {
  try {
    console.log('🔍 COMPREHENSIVE PACKAGE-COUNTRY MISMATCH CHECKER');
    console.log('=' .repeat(60));

    // Get all packages
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('*')
      .order('country_name');

    if (error) throw error;
    console.log(`📦 Analyzing ${packages.length} packages...\n`);

    const mismatches = [];

    // Check 1: Europe & United States packages
    const europeUSMismatches = packages.filter(pkg => 
      pkg.name.includes('Europe') && 
      pkg.name.includes('United States') && 
      pkg.country_name !== 'Europe & United States'
    );

    // Check 2: Germany packages  
    const germanyMismatches = packages.filter(pkg => 
      (pkg.name.includes('Germany') || pkg.name.includes('German')) && 
      pkg.country_name !== 'Germany'
    );

    // Check 3: France packages
    const franceMismatches = packages.filter(pkg => 
      (pkg.name.includes('France') || pkg.name.includes('French')) && 
      pkg.country_name !== 'France'
    );

    // Check 4: Italy packages
    const italyMismatches = packages.filter(pkg => 
      (pkg.name.includes('Italy') || pkg.name.includes('Italian')) && 
      pkg.country_name !== 'Italy'
    );

    // Check 5: Spain packages
    const spainMismatches = packages.filter(pkg => 
      (pkg.name.includes('Spain') || pkg.name.includes('Spanish')) && 
      pkg.country_name !== 'Spain'
    );

    // Check 6: UK packages
    const ukMismatches = packages.filter(pkg => 
      (pkg.name.includes('United Kingdom') || pkg.name.includes('UK') || pkg.name.includes('Britain')) && 
      pkg.country_name !== 'United Kingdom'
    );

    // Check 7: Dubai/UAE packages
    const dubaiMismatches = packages.filter(pkg => 
      (pkg.name.includes('Dubai') || pkg.name.includes('UAE') || pkg.name.includes('United Arab Emirates')) && 
      pkg.country_name !== 'Dubai'
    );

    // Check 8: Turkey packages
    const turkeyMismatches = packages.filter(pkg => 
      (pkg.name.includes('Turkey') || pkg.name.includes('Turkish')) && 
      pkg.country_name !== 'Turkey'
    );

    // Display results
    const checks = [
      { name: 'Europe & United States', mismatches: europeUSMismatches, correctCountry: 'Europe & United States' },
      { name: 'Germany', mismatches: germanyMismatches, correctCountry: 'Germany' },
      { name: 'France', mismatches: franceMismatches, correctCountry: 'France' },
      { name: 'Italy', mismatches: italyMismatches, correctCountry: 'Italy' },
      { name: 'Spain', mismatches: spainMismatches, correctCountry: 'Spain' },
      { name: 'United Kingdom', mismatches: ukMismatches, correctCountry: 'United Kingdom' },
      { name: 'Dubai/UAE', mismatches: dubaiMismatches, correctCountry: 'Dubai' },
      { name: 'Turkey', mismatches: turkeyMismatches, correctCountry: 'Turkey' }
    ];

    let totalMismatches = 0;
    const allMismatches = [];

    console.log('📊 MISMATCH SUMMARY:');
    checks.forEach(check => {
      console.log(`${check.name}: ${check.mismatches.length} mismatches`);
      totalMismatches += check.mismatches.length;
      
      check.mismatches.forEach(pkg => {
        allMismatches.push({
          ...pkg,
          suggestedCountry: check.correctCountry
        });
      });
    });

    console.log(`\nTotal mismatches found: ${totalMismatches}\n`);

    if (totalMismatches === 0) {
      console.log('✅ No package-country mismatches found!');
      console.log('All packages have consistent naming and country assignments.');
      return;
    }

    // Display detailed mismatches
    console.log('📋 DETAILED MISMATCHES:');
    console.log('');

    allMismatches.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.id.substring(0, 8)}... - "${pkg.name}"`);
      console.log(`   ❌ Current: "${pkg.country_name}"`);
      console.log(`   ✅ Should be: "${pkg.suggestedCountry}"`);
      console.log(`   Data: ${pkg.data_amount}GB, Price: $${pkg.sale_price}`);
      console.log('');
    });

    // Auto-fix option
    const shouldFix = process.argv.includes('--fix');
    
    if (shouldFix) {
      console.log('🔧 APPLYING FIXES...\n');
      let fixedCount = 0;

      for (const pkg of allMismatches) {
        try {
          const { error } = await supabase
            .from('my_packages')
            .update({ 
              country_name: pkg.suggestedCountry,
              updated_at: new Date().toISOString()
            })
            .eq('id', pkg.id);

          if (error) {
            console.log(`❌ Failed to fix ${pkg.id}: ${error.message}`);
          } else {
            console.log(`✅ Fixed ${pkg.id.substring(0, 8)}...: "${pkg.country_name}" → "${pkg.suggestedCountry}"`);
            fixedCount++;
          }
        } catch (error) {
          console.log(`❌ Error fixing ${pkg.id}: ${error.message}`);
        }
      }

      console.log(`\n🎉 Fixed ${fixedCount} out of ${totalMismatches} packages!`);
    } else {
      console.log('🔧 To fix these mismatches automatically, run:');
      console.log('node comprehensive_package_country_fix.js --fix');
    }

    // Show country distribution
    console.log('\n📊 PACKAGE DISTRIBUTION BY COUNTRY:');
    const countryCounts = {};
    packages.forEach(pkg => {
      countryCounts[pkg.country_name] = (countryCounts[pkg.country_name] || 0) + 1;
    });

    Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        console.log(`${country}: ${count} packages`);
      });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllMismatches().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Mismatch check completed!');
}); 