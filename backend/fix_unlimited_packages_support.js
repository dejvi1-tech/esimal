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

async function fixUnlimitedPackagesSupport() {
  console.log('🔧 FIXING UNLIMITED PACKAGES SUPPORT\n');
  console.log('=' * 60);

  // STEP 1: Fix database constraints
  console.log('\n1️⃣ FIXING DATABASE CONSTRAINTS');
  console.log('-'.repeat(50));
  
  try {
    // Remove restrictive constraints that block unlimited packages
    console.log('🗑️ Removing restrictive database constraints...');
    
    // For packages table - allow data_amount to be 0 for unlimited
    const packagesConstraintFix = `
      -- Drop existing constraint that blocks unlimited
      ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_data_amount_check;
      
      -- Add new constraint that allows unlimited (0 values)
      ALTER TABLE packages ADD CONSTRAINT packages_data_amount_check 
        CHECK (data_amount ~ '^(\\d+GB|\\d+MB|Unlimited)$' OR data_amount::numeric >= 0);
      
      -- Allow days = 0 for unlimited duration packages  
      ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_days_check;
      ALTER TABLE packages ADD CONSTRAINT packages_days_check CHECK (days >= 0);
    `;
    
    // For my_packages table - allow data_amount and days to be 0
    const myPackagesConstraintFix = `
      -- Allow unlimited data (data_amount = 0)
      ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_data_amount_check;
      
      -- Allow unlimited duration (days = 0) - remove the > 0 constraint
      ALTER TABLE my_packages DROP CONSTRAINT IF EXISTS my_packages_days_check;
      ALTER TABLE my_packages ADD CONSTRAINT my_packages_days_check CHECK (days >= 0);
    `;
    
    console.log('📝 Executing SQL fixes for packages table...');
    
    // Note: We can't execute raw SQL with the client directly, so we'll use RPC or note manual execution
    console.log('⚠️  Manual SQL execution required:');
    console.log('\n-- EXECUTE THESE SQL COMMANDS IN SUPABASE DASHBOARD:');
    console.log(packagesConstraintFix);
    console.log(myPackagesConstraintFix);
    
  } catch (error) {
    console.error('❌ Error fixing database constraints:', error.message);
  }

  // STEP 2: Test unlimited package creation
  console.log('\n2️⃣ TESTING UNLIMITED PACKAGE CREATION');
  console.log('-'.repeat(50));
  
  try {
    // Create a test unlimited package
    const testUnlimitedPackage = {
      id: 'test-unlimited-' + Date.now(),
      name: 'Unlimited Test Package',
      country_name: 'Test Country',
      country_code: 'TC',
      data_amount: 0, // 0 = unlimited
      days: 30,
      base_price: 25.99,
      sale_price: 29.99,
      profit: 4.00,
      reseller_id: null,
      region: 'Global',
      visible: true,
      show_on_frontend: true,
      location_slug: 'test-unlimited',
      homepage_order: 1,
      slug: 'esim-test-30days-unlimited-all',
      features: {
        packageId: 'esim-test-30days-unlimited-all',
        dataAmount: 0,
        days: 30,
        price: 25.99,
        currency: 'EUR',
        plan: 'data-only',
        activation: 'first-use',
        isUnlimited: true, // Key unlimited flag
        withSMS: false,
        withCall: false,
        withHotspot: true,
        withDataRoaming: true,
        geography: 'global',
        region: 'Global',
        countrySlug: 'test',
        notes: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📦 Attempting to create test unlimited package...');
    
    const { data: createdPackage, error: createError } = await supabase
      .from('my_packages')
      .insert(testUnlimitedPackage)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create unlimited package:', createError.message);
      console.log('💡 This indicates database constraints are still blocking unlimited packages');
      console.log('   Please run the SQL fixes manually in Supabase dashboard');
    } else {
      console.log('✅ Successfully created unlimited test package!');
      console.log(`   Package ID: ${createdPackage.id}`);
      console.log(`   Data Amount: ${createdPackage.data_amount} (0 = unlimited)`);
      console.log(`   isUnlimited: ${createdPackage.features?.isUnlimited}`);
      
      // Clean up test package
      await supabase
        .from('my_packages')
        .delete()
        .eq('id', createdPackage.id);
      console.log('🧹 Cleaned up test package');
    }
    
  } catch (error) {
    console.error('❌ Error testing unlimited package creation:', error.message);
  }

  // STEP 3: Fix existing validation logic
  console.log('\n3️⃣ VALIDATION LOGIC ISSUES TO FIX');
  console.log('-'.repeat(50));
  
  console.log('📝 The following files need manual fixes:');
  console.log('\n1. backend/src/utils/zodSchemas.ts');
  console.log('   ❌ Change: data_amount: z.coerce.number().positive()');
  console.log('   ✅ To: data_amount: z.coerce.number().min(0) // Allow 0 for unlimited');
  console.log('   ❌ Change: days: z.coerce.number().positive()'); 
  console.log('   ✅ To: days: z.coerce.number().min(0) // Allow 0 for unlimited duration');
  
  console.log('\n2. backend/src/utils/roamifyMapper.ts');
  console.log('   ❌ Change: if (!data.data_amount || data.data_amount <= 0)');
  console.log('   ✅ To: if (data.data_amount === undefined || data.data_amount < 0)');
  console.log('   ❌ Change: if (!data.days || data.days <= 0)');
  console.log('   ✅ To: if (data.days === undefined || data.days < 0)');
  
  console.log('\n3. Sync scripts (add_packages_flexible.js, etc.)');
  console.log('   ❌ Remove filters that skip unlimited packages');
  console.log('   ✅ Include packages with data_amount = 0 and isUnlimited = true');

  // STEP 4: Check existing unlimited packages in Roamify
  console.log('\n4️⃣ CHECKING ROAMIFY FOR UNLIMITED PACKAGES');
  console.log('-'.repeat(50));
  
  const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL;
  const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
  
  if (ROAMIFY_API_URL && ROAMIFY_API_KEY) {
    try {
      console.log('📡 Fetching packages from Roamify API...');
      const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
        headers: {
          'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        const countries = response.data.data?.packages || [];
        let unlimitedFound = 0;
        
        for (const country of countries) {
          if (country.packages && Array.isArray(country.packages)) {
            for (const pkg of country.packages) {
              if (pkg.isUnlimited === true || 
                  (pkg.package && pkg.package.toLowerCase().includes('unlimited'))) {
                unlimitedFound++;
                if (unlimitedFound <= 3) { // Show first 3 examples
                  console.log(`  📦 ${country.countryName}: ${pkg.package}`);
                  console.log(`     isUnlimited: ${pkg.isUnlimited}, dataAmount: ${pkg.dataAmount}, price: €${pkg.price}`);
                }
              }
            }
          }
        }
        
        console.log(`✅ Found ${unlimitedFound} unlimited packages in Roamify API`);
        if (unlimitedFound === 0) {
          console.log('⚠️  No unlimited packages found - they may not be available');
        }
        
      } else {
        console.log(`⚠️  Roamify API returned status ${response.status}`);
      }
      
    } catch (apiError) {
      console.log('⚠️  Could not check Roamify API:', apiError.message);
    }
  } else {
    console.log('⚠️  Roamify API credentials not configured');
  }

  // STEP 5: Test frontend display formatting
  console.log('\n5️⃣ TESTING FRONTEND DISPLAY LOGIC');
  console.log('-'.repeat(50));
  
  // Test the formatDataAmount function
  console.log('🧪 Testing data amount formatting:');
  
  const testCases = [
    { input: 0, expected: 'Unlimited' },
    { input: 1, expected: '1 GB' },
    { input: 1.5, expected: '1.5 GB' },
    { input: 0.5, expected: '512 MB' }
  ];
  
  testCases.forEach((test, idx) => {
    const result = formatDataAmountForDisplay(test.input);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`  ${status} ${test.input}GB → "${result}" (expected: "${test.expected}")`);
  });

  // STEP 6: Create sample unlimited packages
  console.log('\n6️⃣ CREATING SAMPLE UNLIMITED PACKAGES');
  console.log('-'.repeat(50));
  
  const sampleUnlimitedPackages = [
    {
      name: 'Unlimited Europe 7 Days',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 0, // unlimited
      days: 7,
      base_price: 19.99,
      sale_price: 23.99,
      features: { isUnlimited: true, packageId: 'esim-eu-7days-unlimited-all' }
    },
    {
      name: 'Unlimited USA 15 Days', 
      country_name: 'United States',
      country_code: 'US',
      data_amount: 0, // unlimited
      days: 15,
      base_price: 35.99,
      sale_price: 39.99,
      features: { isUnlimited: true, packageId: 'esim-us-15days-unlimited-all' }
    },
    {
      name: 'Unlimited Global 30 Days',
      country_name: 'Global',
      country_code: 'GL',
      data_amount: 0, // unlimited
      days: 30,
      base_price: 59.99,
      sale_price: 69.99,
      features: { isUnlimited: true, packageId: 'esim-global-30days-unlimited-all' }
    }
  ];
  
  console.log('📦 Sample unlimited packages to create:');
  sampleUnlimitedPackages.forEach((pkg, idx) => {
    console.log(`  ${idx + 1}. ${pkg.name} - €${pkg.sale_price} (${pkg.days} days)`);
  });
  
  console.log('\n💡 After fixing constraints, you can create these with:');
  console.log('   POST /api/admin/save-package with data_amount: 0 and features.isUnlimited: true');

  // STEP 7: Summary and next steps
  console.log('\n7️⃣ SUMMARY AND NEXT STEPS');
  console.log('-'.repeat(50));
  
  console.log('🔧 Required Manual Fixes:');
  console.log('\n1. Database Constraints (CRITICAL):');
  console.log('   - Run the SQL commands shown above in Supabase dashboard');
  console.log('   - This removes CHECK constraints blocking data_amount = 0');
  
  console.log('\n2. Code Validation (HIGH PRIORITY):');
  console.log('   - Fix zodSchemas.ts to allow 0 values');
  console.log('   - Fix roamifyMapper.ts validation logic');
  console.log('   - Update sync scripts to include unlimited packages');
  
  console.log('\n3. Frontend Display (MEDIUM PRIORITY):');
  console.log('   - Verify formatDataAmount shows "Unlimited" for 0GB');
  console.log('   - Test checkout flow with unlimited packages');
  console.log('   - Ensure slug generation works for unlimited packages');
  
  console.log('\n4. Testing (LOW PRIORITY):');
  console.log('   - Create test unlimited packages via admin panel');
  console.log('   - Verify frontend display and ordering flow');
  console.log('   - Test eSIM delivery for unlimited packages');
  
  console.log('\n📋 Files to Update:');
  console.log('   ✅ backend/src/utils/zodSchemas.ts');
  console.log('   ✅ backend/src/utils/roamifyMapper.ts');
  console.log('   ✅ backend/add_packages_flexible.js');
  console.log('   ✅ backend/complete_package_sync_fix.js');
  console.log('   ✅ All sync scripts that filter packages');
  
  console.log('\n' + '=' * 60);
  console.log('🎯 UNLIMITED PACKAGES FIX PLAN COMPLETE');
  console.log('Run the manual fixes above to enable unlimited packages!');
}

// Helper function to format data amounts for display
function formatDataAmountForDisplay(valueInGB) {
  if (valueInGB === 0) return 'Unlimited';
  
  if (valueInGB >= 1) {
    return valueInGB % 1 === 0 ? `${valueInGB} GB` : `${valueInGB.toFixed(1)} GB`;
  }
  
  // For values less than 1 GB, show as MB
  const mb = Math.round(valueInGB * 1024);
  return `${mb} MB`;
}

// Run the fix
fixUnlimitedPackagesSupport().catch(console.error); 