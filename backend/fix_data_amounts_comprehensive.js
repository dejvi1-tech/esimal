const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('This script should be run on the cloud platform where environment variables are configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fix incorrectly stored data amounts in my_packages table
 * Common incorrect patterns (multiply by 1024 bug):
 * - 1024 -> 1 GB
 * - 3072 -> 3 GB  
 * - 5120 -> 5 GB
 * - 10240 -> 10 GB
 * - 15360 -> 15 GB
 * - 20480 -> 20 GB
 * - 30720 -> 30 GB
 * - 51200 -> 50 GB
 */
function fixIncorrectDataAmount(currentValue) {
  const commonConversions = {
    1024: 1,
    3072: 3,
    5120: 5,
    10240: 10,
    15360: 15,
    20480: 20,
    30720: 30,
    51200: 50
  };

  // Check if it's a known incorrect conversion
  if (commonConversions[currentValue]) {
    return commonConversions[currentValue];
  }

  // Check if it's a multiple of 1024 and convert
  if (currentValue > 100 && currentValue % 1024 === 0) {
    const gbValue = currentValue / 1024;
    if (gbValue <= 100) { // Reasonable GB amount
      return gbValue;
    }
  }

  // If it's already reasonable, keep it
  return currentValue;
}

/**
 * Extract data amount from package name if the stored value seems wrong
 */
function extractDataAmountFromName(name) {
  if (!name) return null;

  // Check for unlimited
  if (name.toLowerCase().includes('unlimited')) {
    return 0;
  }

  // Look for GB patterns in the name
  const gbMatch = name.match(/(\d+)\s*GB/i);
  if (gbMatch) {
    return parseInt(gbMatch[1]);
  }

  const mbMatch = name.match(/(\d+)\s*MB/i);
  if (mbMatch) {
    return Math.round((parseInt(mbMatch[1]) / 1024) * 10) / 10; // Round to 1 decimal
  }

  return null;
}

async function fixDataAmounts() {
  try {
    console.log('🔧 COMPREHENSIVE DATA AMOUNT FIX');
    console.log('=' .repeat(60));

    // 1. Get all packages with their current data amounts
    const { data: allPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, sale_price, days, updated_at')
      .order('data_amount', { ascending: false });

    if (fetchError) {
      console.error('Error fetching packages:', fetchError);
      return;
    }

    console.log(`📦 Found ${allPackages.length} packages to analyze\n`);

    // 2. Analyze and categorize packages
    const problematicPackages = [];
    const reasonablePackages = [];
    const suspiciousPackages = [];

    allPackages.forEach(pkg => {
      const currentValue = pkg.data_amount;
      const fixedValue = fixIncorrectDataAmount(currentValue);
      const nameExtractedValue = extractDataAmountFromName(pkg.name);

      if (currentValue !== fixedValue) {
        problematicPackages.push({
          ...pkg,
          fixedValue,
          nameExtractedValue,
          reason: 'Conversion pattern detected'
        });
      } else if (currentValue > 100) {
        suspiciousPackages.push({
          ...pkg,
          fixedValue: nameExtractedValue || currentValue,
          nameExtractedValue,
          reason: 'Suspiciously large value'
        });
      } else {
        reasonablePackages.push(pkg);
      }
    });

    console.log('📊 ANALYSIS RESULTS:');
    console.log(`✅ Reasonable packages: ${reasonablePackages.length}`);
    console.log(`❌ Problematic packages (known patterns): ${problematicPackages.length}`);
    console.log(`⚠️  Suspicious packages (>100GB): ${suspiciousPackages.length}\n`);

    // 3. Show problematic packages
    if (problematicPackages.length > 0) {
      console.log('❌ PROBLEMATIC PACKAGES (Will be auto-fixed):');
      problematicPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.country_name} - ${pkg.name}`);
        console.log(`   Current: ${pkg.data_amount}GB → Fixed: ${pkg.fixedValue}GB`);
        console.log(`   ${pkg.reason}`);
        console.log('');
      });
    }

    // 4. Show suspicious packages
    if (suspiciousPackages.length > 0) {
      console.log('⚠️  SUSPICIOUS PACKAGES (Manual review suggested):');
      suspiciousPackages.slice(0, 10).forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.country_name} - ${pkg.name}`);
        console.log(`   Current: ${pkg.data_amount}GB`);
        if (pkg.nameExtractedValue) {
          console.log(`   Name suggests: ${pkg.nameExtractedValue}GB`);
        } else {
          console.log(`   Name analysis: No clear pattern found`);
        }
        console.log('');
      });
      if (suspiciousPackages.length > 10) {
        console.log(`   ... and ${suspiciousPackages.length - 10} more\n`);
      }
    }

    // 5. Ask for confirmation and fix
    console.log(`🔧 READY TO FIX ${problematicPackages.length} problematic packages\n`);

    let fixedCount = 0;
    let errorCount = 0;

    // Fix problematic packages (those with known conversion patterns)
    for (const pkg of problematicPackages) {
      try {
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({
            data_amount: pkg.fixedValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);

        if (updateError) {
          console.log(`❌ Error fixing ${pkg.name}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Fixed: ${pkg.name} (${pkg.country_name}) - ${pkg.data_amount}GB → ${pkg.fixedValue}GB`);
          fixedCount++;
        }
      } catch (error) {
        console.log(`❌ Error fixing ${pkg.name}: ${error.message}`);
        errorCount++;
      }
    }

    // 6. Fix suspicious packages that have clear name patterns
    console.log('\n🔍 FIXING SUSPICIOUS PACKAGES WITH CLEAR NAME PATTERNS:');
    let suspiciousFixedCount = 0;

    for (const pkg of suspiciousPackages) {
      if (pkg.nameExtractedValue && pkg.nameExtractedValue !== pkg.data_amount) {
        try {
          const { error: updateError } = await supabase
            .from('my_packages')
            .update({
              data_amount: pkg.nameExtractedValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', pkg.id);

          if (updateError) {
            console.log(`❌ Error fixing ${pkg.name}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`✅ Fixed suspicious: ${pkg.name} (${pkg.country_name}) - ${pkg.data_amount}GB → ${pkg.nameExtractedValue}GB`);
            suspiciousFixedCount++;
          }
        } catch (error) {
          console.log(`❌ Error fixing ${pkg.name}: ${error.message}`);
          errorCount++;
        }
      }
    }

    // 7. Final summary
    console.log('\n🎉 FIX COMPLETED!');
    console.log('=' .repeat(60));
    console.log(`✅ Fixed problematic packages: ${fixedCount}`);
    console.log(`✅ Fixed suspicious packages: ${suspiciousFixedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📊 Total fixed: ${fixedCount + suspiciousFixedCount}`);

    // 8. Verify results
    console.log('\n🔍 VERIFICATION:');
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('data_amount')
      .gt('data_amount', 100);

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
    } else {
      console.log(`📊 Packages still >100GB: ${verifyPackages.length}`);
      if (verifyPackages.length === 0) {
        console.log('🎉 All packages now have reasonable data amounts!');
      } else {
        console.log('⚠️  Some packages still need manual review');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error during fix:', error);
  }
}

// Run the fix
fixDataAmounts(); 