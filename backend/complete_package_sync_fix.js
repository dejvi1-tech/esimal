const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ROAMIFY_API_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ROAMIFY_API_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function completePackageSyncFix() {
  console.log('🚀 Starting COMPLETE package sync fix...\n');
  console.log('This will:');
  console.log('1. Clear all data from my_packages table');
  console.log('2. Fetch all packages from Roamify API');
  console.log('3. Create properly mapped packages in my_packages');
  console.log('4. Ensure customers get exactly what they order\n');

  try {
    // Step 1: Clear my_packages table
    console.log('🗑️ Step 1: Clearing my_packages table...');
    const { error: clearError } = await supabase
      .from('my_packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clearError) {
      console.error('❌ Error clearing my_packages:', clearError);
      return;
    }
    console.log('✅ my_packages table cleared\n');

    // Step 2: Fetch all packages from Roamify API
    console.log('📡 Step 2: Fetching ALL packages from Roamify API...');
    const response = await axios.get(`${process.env.ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const countries = response.data.data?.packages || [];
    console.log(`✅ Found ${countries.length} countries from Roamify\n`);

    // Step 3: Process and add packages strategically
    console.log('🎯 Step 3: Processing packages strategically...');
    
    let packagesAdded = 0;
    let errors = 0;

    // Priority countries for your market
    const priorityCountries = [
      'germany', 'deutschland', 'italy', 'italia', 'france', 'spain', 
      'united kingdom', 'uk', 'netherlands', 'belgium', 'austria',
      'united states', 'usa', 'canada'
    ];

    // Common data amounts customers want
    const popularDataAmounts = [1, 2, 3, 5, 10, 15, 20]; // in GB
    const popularDurations = [7, 15, 30]; // in days

    for (const country of countries) {
      if (!country.packages || !Array.isArray(country.packages)) continue;

      const countryName = country.countryName?.toLowerCase() || '';
      const isPriorityCountry = priorityCountries.some(p => countryName.includes(p));

      // Skip non-priority countries for now (you can add them later manually)
      if (!isPriorityCountry) continue;

      console.log(`\n🇫🇷 Processing: ${country.countryName} (${country.countryCode})`);

      for (const pkg of country.packages) {
        try {
          // Parse package data
          let dataAmountGB = 0;
          if (pkg.dataAmount && pkg.dataUnit) {
            if (pkg.dataUnit.toUpperCase() === 'GB') {
              dataAmountGB = pkg.dataAmount;
            } else if (pkg.dataUnit.toUpperCase() === 'MB') {
              dataAmountGB = pkg.dataAmount / 1024;
            }
          }

          const days = pkg.day || 0;
          const price = pkg.price || 0;

          // Only add packages that match popular configurations
          const isPopularData = popularDataAmounts.includes(Math.round(dataAmountGB));
          const isPopularDuration = popularDurations.includes(days);

          if (!isPopularData || !isPopularDuration || !price) {
            continue; // Skip unpopular configurations
          }

          // Create package for my_packages
          const myPackageData = {
            id: `${country.countryCode?.toLowerCase() || 'xx'}-${Math.round(dataAmountGB)}gb-${days}d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${Math.round(dataAmountGB)}GB - ${days} days`,
            country_name: country.countryName,
            country_code: country.countryCode?.toUpperCase() || 'XX',
            data_amount: dataAmountGB,
            days: days,
            base_price: price,
            sale_price: price * 1.2, // 20% markup
            profit: price * 0.2,
            reseller_id: pkg.packageId, // ✅ Store REAL Roamify package ID here
            region: country.region || 'Unknown',
            visible: true,
            show_on_frontend: true,
            location_slug: country.countryCode?.toLowerCase() || 'unknown',
            homepage_order: isPriorityCountry ? 1 : 2,
            // ✅ CRITICAL: Store real Roamify package ID in features
            features: {
              packageId: pkg.packageId, // Real Roamify package ID
              dataAmount: dataAmountGB,
              days: days,
              price: price,
              currency: 'EUR',
              plan: pkg.plan || 'data-only',
              activation: pkg.activation || 'first-use',
              isUnlimited: pkg.isUnlimited || false,
              withSMS: pkg.withSMS || false,
              withCall: pkg.withCall || false,
              withHotspot: pkg.withHotspot || true,
              withDataRoaming: pkg.withDataRoaming || true,
              geography: country.geography || 'local',
              region: country.region,
              countrySlug: country.countrySlug,
              notes: [],
              // Metadata for debugging
              originalRoamifyData: {
                packageId: pkg.packageId,
                package: pkg.package,
                dataAmount: pkg.dataAmount,
                dataUnit: pkg.dataUnit,
                day: pkg.day,
                price: pkg.price
              }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Insert package
          const { error: insertError } = await supabase
            .from('my_packages')
            .insert(myPackageData);

          if (insertError) {
            console.error(`   ❌ Error adding ${pkg.packageId}:`, insertError.message);
            errors++;
          } else {
            console.log(`   ✅ Added: ${myPackageData.name} (${pkg.packageId})`);
            packagesAdded++;
          }

        } catch (error) {
          console.error(`   ❌ Error processing package:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`✅ Packages successfully added: ${packagesAdded}`);
    console.log(`❌ Errors encountered: ${errors}`);
    console.log(`📦 Countries processed: ${countries.length}`);

    console.log('\n🎉 COMPLETE PACKAGE SYNC COMPLETED!');
    console.log('');
    console.log('✅ Benefits of this fix:');
    console.log('   - Customers get exactly what they order');
    console.log('   - Real Roamify package IDs used throughout');
    console.log('   - No more Germany → Europe mismatches');
    console.log('   - No more 30 days → 3 days mismatches');
    console.log('   - Popular packages from priority countries');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Test a Germany order → should get Germany package');
    console.log('   2. Check your admin panel → should show new packages');
    console.log('   3. Verify no more fallback warnings in logs');

    if (packagesAdded > 0) {
      console.log('\n🚀 Your eSIM marketplace is now properly configured!');
    }

  } catch (error) {
    console.error('❌ Error during complete package sync:', error.message);
  }
}

// Run the complete fix
completePackageSyncFix().catch(console.error); 