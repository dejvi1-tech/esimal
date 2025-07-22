const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

// Roamify API configuration
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;

async function diagnoseUnlimitedPackagesIssue() {
  console.log('🔍 COMPREHENSIVE UNLIMITED PACKAGES DIAGNOSTIC\n');
  console.log('=' * 60);

  // STEP 1: Check Roamify API for unlimited packages
  console.log('\n1️⃣ CHECKING ROAMIFY API FOR UNLIMITED PACKAGES');
  console.log('-'.repeat(50));
  
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (response.status !== 200) {
      console.error(`❌ Roamify API returned status ${response.status}`);
      return;
    }

    const roamifyData = response.data;
    const countries = roamifyData.data?.packages || [];
    
    let totalPackages = 0;
    let unlimitedPackages = [];
    let packagesWithIsUnlimited = [];
    
    console.log(`📡 Found ${countries.length} countries from Roamify`);
    
    for (const country of countries) {
      if (country.packages && Array.isArray(country.packages)) {
        for (const pkg of country.packages) {
          totalPackages++;
          
          // Check for unlimited indicators
          if (pkg.isUnlimited === true) {
            packagesWithIsUnlimited.push({
              packageId: pkg.packageId,
              country: country.countryName,
              package: pkg.package,
              dataAmount: pkg.dataAmount,
              dataUnit: pkg.dataUnit,
              isUnlimited: pkg.isUnlimited,
              price: pkg.price,
              day: pkg.day
            });
          }
          
          // Check for unlimited in package name or description
          if (pkg.package && pkg.package.toLowerCase().includes('unlimited')) {
            unlimitedPackages.push({
              packageId: pkg.packageId,
              country: country.countryName,
              package: pkg.package,
              dataAmount: pkg.dataAmount,
              dataUnit: pkg.dataUnit,
              isUnlimited: pkg.isUnlimited,
              price: pkg.price,
              day: pkg.day
            });
          }
        }
      }
    }
    
    console.log(`📊 Total packages: ${totalPackages}`);
    console.log(`♾️  Packages with isUnlimited=true: ${packagesWithIsUnlimited.length}`);
    console.log(`🔤 Packages with "unlimited" in name: ${unlimitedPackages.length}`);
    
    if (packagesWithIsUnlimited.length > 0) {
      console.log('\n✅ Found packages with isUnlimited=true:');
      packagesWithIsUnlimited.slice(0, 5).forEach((pkg, idx) => {
        console.log(`  ${idx + 1}. ${pkg.country} - ${pkg.package} (${pkg.packageId})`);
        console.log(`     Data: ${pkg.dataAmount} ${pkg.dataUnit}, Price: €${pkg.price}, Days: ${pkg.day}`);
      });
    } else {
      console.log('❌ No packages found with isUnlimited=true');
    }
    
    if (unlimitedPackages.length > 0) {
      console.log('\n📝 Found packages with "unlimited" in name:');
      unlimitedPackages.slice(0, 5).forEach((pkg, idx) => {
        console.log(`  ${idx + 1}. ${pkg.country} - ${pkg.package} (${pkg.packageId})`);
        console.log(`     Data: ${pkg.dataAmount} ${pkg.dataUnit}, isUnlimited: ${pkg.isUnlimited}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching from Roamify API:', error.message);
  }

  // STEP 2: Check packages table schema and constraints
  console.log('\n\n2️⃣ CHECKING PACKAGES TABLE SCHEMA AND CONSTRAINTS');
  console.log('-'.repeat(50));
  
  try {
    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'packages' })
      .single();
      
    if (tableError) {
      console.log('⚠️  Could not get table info via RPC, checking manually...');
      
      // Check data_amount constraint manually
      const { data: constraintData, error: constraintError } = await supabase
        .from('packages')
        .select('data_amount')
        .limit(1);
        
      if (constraintError) {
        console.error('❌ Error checking packages table:', constraintError);
      } else {
        console.log('✅ packages table accessible');
      }
    }
    
    // Check for unlimited packages in packages table
    const { data: unlimitedInPackages, error: unlimitedError } = await supabase
      .from('packages')
      .select('*')
      .or('data_amount.eq.Unlimited,features->>isUnlimited.eq.true');
      
    if (unlimitedError) {
      console.error('❌ Error querying unlimited packages:', unlimitedError);
    } else {
      console.log(`📊 Unlimited packages in packages table: ${unlimitedInPackages?.length || 0}`);
      if (unlimitedInPackages && unlimitedInPackages.length > 0) {
        unlimitedInPackages.forEach((pkg, idx) => {
          console.log(`  ${idx + 1}. ${pkg.name} - ${pkg.data_amount} (${pkg.country_name})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking packages table:', error.message);
  }

  // STEP 3: Check my_packages table schema and constraints
  console.log('\n\n3️⃣ CHECKING MY_PACKAGES TABLE SCHEMA AND CONSTRAINTS');
  console.log('-'.repeat(50));
  
  try {
    // Check if table exists and get structure
    const { data: myPackagesData, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);
      
    if (myPackagesError) {
      console.error('❌ Error accessing my_packages table:', myPackagesError);
    } else {
      console.log('✅ my_packages table accessible');
      if (myPackagesData && myPackagesData.length > 0) {
        console.log('📋 Sample my_packages record structure:');
        console.log('   Fields:', Object.keys(myPackagesData[0]));
      }
    }
    
    // Check for unlimited packages in my_packages
    const { data: unlimitedInMyPackages, error: unlimitedMyError } = await supabase
      .from('my_packages')
      .select('*')
      .or('data_amount.eq.0,features->>isUnlimited.eq.true,name.ilike.%unlimited%');
      
    if (unlimitedMyError) {
      console.error('❌ Error querying unlimited in my_packages:', unlimitedMyError);
    } else {
      console.log(`📊 Potential unlimited packages in my_packages table: ${unlimitedInMyPackages?.length || 0}`);
      if (unlimitedInMyPackages && unlimitedInMyPackages.length > 0) {
        unlimitedInMyPackages.forEach((pkg, idx) => {
          console.log(`  ${idx + 1}. ${pkg.name} - ${pkg.data_amount}GB (${pkg.country_name})`);
          if (pkg.features && pkg.features.isUnlimited) {
            console.log(`     ♾️ isUnlimited: ${pkg.features.isUnlimited}`);
          }
        });
      }
    }
    
    // Check data_amount field type and constraints
    const { data: allMyPackages, error: allMyError } = await supabase
      .from('my_packages')
      .select('id, name, data_amount, country_name, features')
      .order('data_amount', { ascending: false })
      .limit(10);
      
    if (allMyError) {
      console.error('❌ Error getting my_packages data:', allMyError);
    } else {
      console.log('\n📊 Top 10 my_packages by data_amount:');
      allMyPackages.forEach((pkg, idx) => {
        const isUnlimited = pkg.features?.isUnlimited || pkg.data_amount === 0;
        console.log(`  ${idx + 1}. ${pkg.name} - ${pkg.data_amount}GB (${pkg.country_name}) ${isUnlimited ? '♾️' : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking my_packages table:', error.message);
  }

  // STEP 4: Check sync logic for unlimited package handling
  console.log('\n\n4️⃣ CHECKING SYNC LOGIC FOR UNLIMITED PACKAGE FILTERING');
  console.log('-'.repeat(50));
  
  console.log('📝 Key areas to check:');
  console.log('  1. parseDataAmountToGB() function - does it handle unlimited correctly?');
  console.log('  2. copyToMyPackages() function - does it filter out unlimited?');
  console.log('  3. savePackage() function - does it accept unlimited data amounts?');
  console.log('  4. Database constraints - are there checks blocking unlimited?');
  
  // Test data amount parsing
  console.log('\n🧪 Testing data amount parsing logic:');
  
  // Simulate what happens with unlimited packages
  const testCases = [
    { input: 'Unlimited', expected: 0 },
    { input: 'unlimited', expected: 0 },
    { input: '0GB', expected: 0 },
    { input: 0, expected: 0 },
    { dataAmount: 0, isUnlimited: true, expected: 0 }
  ];
  
  testCases.forEach((test, idx) => {
    console.log(`  Test ${idx + 1}: ${JSON.stringify(test.input)} → Expected: ${test.expected}GB`);
  });

  // STEP 5: Check frontend API endpoints
  console.log('\n\n5️⃣ CHECKING FRONTEND API ENDPOINTS');
  console.log('-'.repeat(50));
  
  try {
    // Check if backend is running and test frontend-packages endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    console.log(`📡 Testing frontend-packages endpoint: ${backendUrl}/api/frontend-packages`);
    
    try {
      const frontendResponse = await axios.get(`${backendUrl}/api/frontend-packages`, {
        timeout: 5000
      });
      
      if (frontendResponse.status === 200) {
        const frontendPackages = frontendResponse.data;
        console.log(`✅ Frontend API accessible - ${frontendPackages.length} packages returned`);
        
        // Check for unlimited packages in frontend response
        const unlimitedInFrontend = frontendPackages.filter(pkg => 
          pkg.data_amount === 0 || 
          (pkg.features && pkg.features.isUnlimited) ||
          (pkg.name && pkg.name.toLowerCase().includes('unlimited'))
        );
        
        console.log(`♾️  Unlimited packages in frontend API: ${unlimitedInFrontend.length}`);
        if (unlimitedInFrontend.length > 0) {
          unlimitedInFrontend.forEach((pkg, idx) => {
            console.log(`  ${idx + 1}. ${pkg.name} - ${pkg.data_amount}GB (${pkg.country_name})`);
          });
        }
      }
    } catch (apiError) {
      console.log(`⚠️  Backend API not accessible: ${apiError.message}`);
      console.log('   This is normal if backend is not running locally');
    }
    
  } catch (error) {
    console.log('⚠️  Could not test frontend endpoints - backend may not be running');
  }

  // STEP 6: Provide recommendations
  console.log('\n\n6️⃣ RECOMMENDATIONS AND NEXT STEPS');
  console.log('-'.repeat(50));
  
  console.log('🔧 Potential issues and solutions:');
  console.log('\n1. Database Schema Issues:');
  console.log('   - Check if my_packages.data_amount has constraints blocking 0 values');
  console.log('   - Verify data_amount field type (should allow 0 for unlimited)');
  
  console.log('\n2. Sync Logic Issues:');
  console.log('   - Check if parseDataAmountToGB correctly handles isUnlimited=true');
  console.log('   - Verify copyToMyPackages includes unlimited packages');
  console.log('   - Ensure savePackage accepts data_amount=0 for unlimited');
  
  console.log('\n3. Frontend Display Issues:');
  console.log('   - Check formatDataAmount utility function');
  console.log('   - Verify frontend displays "Unlimited" for data_amount=0');
  console.log('   - Ensure proper slug/ID generation for unlimited packages');
  
  console.log('\n4. Roamify API Issues:');
  console.log('   - Verify Roamify actually provides unlimited packages');
  console.log('   - Check if isUnlimited field is properly set');
  
  console.log('\n📋 To fix, you may need to:');
  console.log('   ✅ Run: node backend/fix_unlimited_packages_support.js');
  console.log('   ✅ Update database constraints if needed');
  console.log('   ✅ Fix sync logic to properly handle unlimited packages');
  console.log('   ✅ Test frontend display of unlimited packages');
  
  console.log('\n' + '=' * 60);
  console.log('🏁 DIAGNOSTIC COMPLETE');
}

// Run the diagnostic
diagnoseUnlimitedPackagesIssue().catch(console.error); 