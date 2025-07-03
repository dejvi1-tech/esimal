const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const roamifyApiKey = process.env.ROAMIFY_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !roamifyApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function testPaginationSync() {
  try {
    console.log('🧪 Testing Roamify packages sync with pagination...');
    
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current database state...');
    const { data: currentPackages, error: currentError } = await supabase
      .from('packages')
      .select('*')
      .limit(5);

    if (currentError) {
      console.error('❌ Error checking current packages:', currentError);
      return;
    }

    console.log(`📦 Current packages in database: ${currentPackages?.length || 0}`);

    // Step 2: Fetch from Roamify API (no pagination needed)
    console.log('\n🌐 Step 2: Fetching from Roamify API...');
    
    const response = await fetch(`${ROAMIFY_API_BASE}/api/esim/packages`, {
      headers: {
        Authorization: `Bearer ${roamifyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Roamify API responded with status: ${response.status}`);
    }

    const json = await response.json();
    
    // Check if we have the expected response structure
    if (!json.data || !json.data.packages || json.data.packages.length === 0) {
      console.log('No packages found in Roamify API response');
      return;
    }

    // Flatten all country packages and attach country info
    const countryObjs = json.data.packages;
    let allPackages = [];
    
    for (const country of countryObjs) {
      if (country.packages && Array.isArray(country.packages)) {
        for (const pkg of country.packages) {
          allPackages.push({
            ...pkg,
            countryName: country.countryName,
            countryCode: country.countryCode,
            region: country.region,
            geography: country.geography
          });
        }
      }
    }
    
    console.log(`📦 Total packages fetched from API: ${allPackages.length}`);

    if (allPackages.length === 0) {
      console.log('⚠️  No packages found from API');
      return;
    }

    // Step 3: Clear existing packages
    console.log('\n🗑️  Step 3: Clearing existing packages...');
    const { error: deleteError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('❌ Error clearing packages:', deleteError);
      return;
    }

    console.log('✅ Cleared existing packages');

    // Step 4: Insert new packages
    console.log('\n💾 Step 4: Inserting packages into database...');
    
    const { v4: uuidv4 } = require('uuid');
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allPackages.length; i += batchSize) {
      const batch = allPackages.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allPackages.length / batchSize)}`);
      
      const batchData = batch.map(pkg => {
        try {
          // Convert dataAmount from MB to GB if needed
          let dataStr = pkg.dataAmount;
          if (typeof pkg.dataAmount === 'number') {
            if (pkg.isUnlimited) {
              dataStr = 'Unlimited';
            } else if (pkg.dataAmount > 1024) {
              dataStr = `${Math.round(pkg.dataAmount / 1024)}GB`;
            } else {
              dataStr = `${pkg.dataAmount}MB`;
            }
          }

          // Validate country_code format
          let countryCode = 'XX'; // Default fallback
          if (pkg.countryCode) {
            countryCode = pkg.countryCode.toUpperCase().slice(0, 2);
          }

          // Only insert if we have all required fields
          const missingFields = [];
          if (!pkg.package) missingFields.push('package');
          if (!pkg.price) missingFields.push('price');
          if (!dataStr) missingFields.push('dataStr');
          if (!pkg.validity_days) missingFields.push('validity_days');
          if (!pkg.countryName) missingFields.push('countryName');
          if (missingFields.length > 0) {
            console.log(`Skipping package due to missing fields [${missingFields.join(', ')}]:`, pkg.package);
            return null;
          }

          return {
            id: uuidv4(),
            name: pkg.package,
            description: pkg.package || '',
            price: pkg.price,
            data_amount: dataStr,
            validity_days: pkg.validity_days,
            country_code: countryCode,
            country_name: pkg.countryName,
            operator: 'Roamify',
            type: 'initial',
            is_active: true,
            features: {
              packageId: pkg.packageId,
              plan: pkg.plan,
              activation: pkg.activation,
              isUnlimited: pkg.isUnlimited,
              withHotspot: pkg.withHotspot,
              withDataRoaming: pkg.withDataRoaming,
              withUsageCheck: pkg.withUsageCheck,
              region: pkg.region,
              geography: pkg.geography
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error processing package:`, error);
          return null;
        }
      }).filter(Boolean);

      if (batchData.length > 0) {
        try {
          const { error } = await supabase.from('packages').upsert(batchData, { onConflict: 'id' });
          
          if (error) {
            console.error(`Error syncing batch:`, error);
            errorCount += batchData.length;
          } else {
            successCount += batchData.length;
            console.log(`✅ Successfully synced ${batchData.length} packages in this batch`);
          }
        } catch (error) {
          console.error(`Error syncing batch:`, error);
          errorCount += batchData.length;
        }
      }
    }

    // Step 5: Verify results
    console.log('\n✅ Step 5: Verifying results...');
    const { data: finalPackages, error: finalError } = await supabase
      .from('packages')
      .select('*')
      .limit(5);

    if (finalError) {
      console.error('❌ Error checking final packages:', finalError);
      return;
    }

    console.log(`\n🎉 Pagination sync completed!`);
    console.log(`✅ Successfully synced: ${successCount} packages`);
    console.log(`❌ Failed to sync: ${errorCount} packages`);
    console.log(`📦 Final packages in database: ${finalPackages?.length || 0}`);

    if (finalPackages && finalPackages.length > 0) {
      console.log('\n📋 Sample synced package:');
      console.log(JSON.stringify(finalPackages[0], null, 2));
    }

    // Step 6: Test pagination API
    console.log('\n🔍 Step 6: Testing pagination API...');
    const testResponse = await fetch('http://localhost:3000/api/admin/all-roamify-packages?page=1&limit=10');
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Pagination API test successful');
      console.log(`📊 API returned ${testData.data?.length || 0} packages`);
      console.log(`📄 Pagination info:`, testData.pagination);
    } else {
      console.log('❌ Pagination API test failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaginationSync(); 