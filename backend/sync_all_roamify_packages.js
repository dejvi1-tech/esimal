const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

if (!ROAMIFY_API_KEY) {
  console.error('❌ Missing required environment variable: ROAMIFY_API_KEY');
  process.exit(1);
}
const ROAMIFY_API_URL = 'https://api.getroamify.com';

// Helper function to convert data amount to string format
function formatDataAmount(dataAmount, dataUnit, isUnlimited) {
  if (isUnlimited) {
    return 'Unlimited';
  }
  
  if (dataUnit === 'MB') {
    if (dataAmount >= 1024) {
      return `${Math.round(dataAmount / 1024)}GB`;
    } else {
      return `${dataAmount}MB`;
    }
  } else if (dataUnit === 'GB') {
    return `${dataAmount}GB`;
  }
  
  return `${dataAmount}${dataUnit}`;
}

// Helper function to parse validity to days
function parseValidityToDays(day) {
  return day || 30; // Default to 30 days if not specified
}

async function syncAllRoamifyPackages() {
  try {
    console.log('🔄 Starting FULL Roamify packages sync...\n');
    
    // 1. Fetch packages from Roamify API
    console.log('📡 Fetching ALL packages from Roamify API...');
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minute timeout
    });

    if (response.status !== 200) {
      throw new Error(`Roamify API returned status ${response.status}`);
    }

    const roamifyData = response.data;
    console.log(`✅ Roamify API response received`);

    if (!roamifyData.data?.packages) {
      throw new Error('Invalid Roamify API response structure');
    }

    // 2. Extract and flatten all packages
    const countries = roamifyData.data.packages;
    let allPackages = [];
    
    for (const country of countries) {
      if (country.packages && Array.isArray(country.packages)) {
        for (const pkg of country.packages) {
          allPackages.push({
            ...pkg,
            countryName: country.countryName,
            countryCode: country.countryCode,
            region: country.region,
            geography: country.geography,
            countrySlug: country.countrySlug
          });
        }
      }
    }

    console.log(`📦 Found ${allPackages.length} packages from ${countries.length} countries`);

    if (allPackages.length === 0) {
      console.log('⚠️  No packages found in Roamify API');
      return;
    }

    // 3. Clear existing packages to avoid duplicates
    console.log('🗑️  Clearing existing packages...');
    const { error: deleteError } = await supabaseAdmin
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

    if (deleteError) {
      console.error('⚠️  Could not clear packages:', deleteError);
    } else {
      console.log('✅ Cleared existing packages');
    }

    // 4. Transform packages for database insertion
    console.log('🔄 Transforming packages...');
    const packagesToInsert = [];
    let transformErrors = 0;

    for (const pkg of allPackages) {
      try {
        // Generate UUID for database
        const packageId = uuidv4();
        
        // Format data amount
        const dataAmount = formatDataAmount(
          pkg.dataAmount || 0,
          pkg.dataUnit || 'MB',
          pkg.isUnlimited || false
        );

        // Parse validity days
        const days = parseValidityToDays(pkg.day);

        // Create package object matching database schema
        const packageData = {
          id: packageId,
          name: pkg.package || 'Unknown Package',
          description: `${dataAmount} for ${days} days in ${pkg.countryName}`,
          country_name: pkg.countryName || 'Unknown',
          country_code: pkg.countryCode?.toUpperCase() || 'XX',
          data_amount: dataAmount,
          days: days,
          price: parseFloat(pkg.price) || 0,
          operator: 'Roamify', // Default operator
          type: 'initial',
          features: {
            packageId: pkg.packageId,
            plan: pkg.plan || 'data-only',
            activation: pkg.activation || 'first-use',
            dataAmount: pkg.dataAmount,
            dataUnit: pkg.dataUnit,
            isUnlimited: pkg.isUnlimited || false,
            withSMS: pkg.withSMS || false,
            withCall: pkg.withCall || false,
            withHotspot: pkg.withHotspot || false,
            withDataRoaming: pkg.withDataRoaming || false,
            region: pkg.region,
            geography: pkg.geography,
            countrySlug: pkg.countrySlug,
            notes: pkg.notes || []
          },
          is_active: true,
          reseller_id: pkg.packageId, // Store original Roamify ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        packagesToInsert.push(packageData);
      } catch (error) {
        transformErrors++;
        console.error(`❌ Error processing package ${pkg.packageId}:`, error.message);
      }
    }

    console.log(`📦 Prepared ${packagesToInsert.length} packages for insertion`);
    if (transformErrors > 0) {
      console.log(`⚠️  ${transformErrors} packages failed transformation`);
    }

    // 5. Insert packages in batches
    const batchSize = 50; // Smaller batches for better reliability
    let successCount = 0;
    let errorCount = 0;
    const totalBatches = Math.ceil(packagesToInsert.length / batchSize);

    console.log(`📤 Starting batch insertion (${totalBatches} batches of ${batchSize})...`);

    for (let i = 0; i < packagesToInsert.length; i += batchSize) {
      const batch = packagesToInsert.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📤 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} packages)...`);

      try {
        const { error } = await supabaseAdmin
          .from('packages')
          .insert(batch);

        if (error) {
          console.error(`❌ Batch ${batchNumber} error:`, error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`✅ Batch ${batchNumber} successful`);
        }
      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} failed:`, batchError);
        errorCount += batch.length;
      }

      // Progress indicator
      const progress = Math.round((batchNumber / totalBatches) * 100);
      console.log(`📊 Progress: ${progress}% (${successCount + errorCount}/${packagesToInsert.length})`);

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 6. Verify results
    const { count: finalCount } = await supabaseAdmin
      .from('packages')
      .select('*', { count: 'exact', head: true });

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`🌍 Countries processed: ${countries.length}`);
    console.log(`📦 Source packages: ${allPackages.length}`);
    console.log(`✅ Successfully synced: ${successCount} packages`);
    console.log(`❌ Failed to sync: ${errorCount} packages`);
    console.log(`🔧 Transform errors: ${transformErrors} packages`);
    console.log(`📊 Total packages in database: ${finalCount}`);
    console.log('='.repeat(60));

    // 7. Show sample packages by country
    const { data: samplePackages } = await supabaseAdmin
      .from('packages')
      .select('*')
      .limit(10);

    if (samplePackages && samplePackages.length > 0) {
      console.log('\n📋 Sample synced packages:');
      samplePackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.country_name}) - ${pkg.data_amount} - $${pkg.price}`);
        console.log(`   Roamify ID: ${pkg.reseller_id}`);
        console.log(`   Days: ${pkg.days}, Operator: ${pkg.operator}`);
      });
    }

    // 8. Show country breakdown
    const { data: countryBreakdown } = await supabaseAdmin
      .from('packages')
      .select('country_name, count(*)')
      .group_by('country_name')
      .order('count', { ascending: false })
      .limit(10);

    if (countryBreakdown && countryBreakdown.length > 0) {
      console.log('\n🌍 Top 10 countries by package count:');
      countryBreakdown.forEach((country, index) => {
        console.log(`${index + 1}. ${country.country_name}: ${country.count} packages`);
      });
    }

    console.log('\n🎉 FULL SYNC COMPLETED SUCCESSFULLY!');
    console.log('✅ AdminPanel should now load packages from the packages table');
    console.log('✅ No more "No packages found in database" errors');
    console.log(`✅ ${finalCount} packages available for selection and management`);

  } catch (error) {
    console.error('❌ FATAL SYNC ERROR:', error.message);
    if (error.response) {
      console.error('📋 API Response:', error.response.data);
      console.error('📋 Status:', error.response.status);
    }
    throw error;
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    await syncAllRoamifyPackages();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    console.log(`\n⏱️  Total sync time: ${duration} seconds`);
    console.log('\n✅ Script completed successfully');
    
  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    console.error(`\n❌ Script failed after ${duration} seconds:`, error.message);
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n⚠️  Script interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the sync
main(); 