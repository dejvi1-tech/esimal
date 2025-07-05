/**
 * TEST: Admin Panel Slug Generation
 * 
 * This script tests that the admin panel savePackage function
 * automatically generates Greece-style slugs for new packages.
 * 
 * Expected behavior: When you create a package through the admin panel,
 * it should automatically get a slug like "esim-greece-30days-1gb-all"
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data for different countries
const testPackages = [
  {
    name: "Greece 1GB - 30 days",
    country_name: "Greece",
    country_code: "GR",
    data_amount: 1,
    days: 30,
    base_price: 2.99,
    sale_price: 4.99,
    profit: 2.00,
    region: "Europe",
    expectedSlug: "esim-greece-30days-1gb-all"
  },
  {
    name: "Albania 3GB - 30 days",
    country_name: "Albania",
    country_code: "AL",
    data_amount: 3,
    days: 30,
    base_price: 3.99,
    sale_price: 5.99,
    profit: 2.00,
    region: "Europe",
    expectedSlug: "esim-albania-30days-3gb-all"
  },
  {
    name: "Germany 5GB - 15 days",
    country_name: "Germany",
    country_code: "DE",
    data_amount: 5,
    days: 15,
    base_price: 4.99,
    sale_price: 7.99,
    profit: 3.00,
    region: "Europe",
    expectedSlug: "esim-germany-15days-5gb-all"
  },
  {
    name: "United States 20GB - 30 days",
    country_name: "United States",
    country_code: "US",
    data_amount: 20,
    days: 30,
    base_price: 9.99,
    sale_price: 14.99,
    profit: 5.00,
    region: "Americas",
    expectedSlug: "esim-united-states-30days-20gb-all"
  }
];

async function testAdminSlugGeneration() {
  console.log('🧪 Testing Admin Panel Slug Generation...\n');

  // Test the slug generation function directly
  console.log('📋 Expected Slug Results:');
  testPackages.forEach(pkg => {
    console.log(`${pkg.country_name} (${pkg.country_code}): ${pkg.expectedSlug}`);
  });
  console.log('');

  // Test creating packages through the admin API
  console.log('🚀 Testing Package Creation through Admin API...\n');

  for (const testPkg of testPackages) {
    try {
      console.log(`Creating package: ${testPkg.name}`);
      
      // Simulate admin panel API call
      const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/admin/save-package`, testPkg, {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const createdPackage = response.data.package;
        console.log(`✅ Package created successfully!`);
        console.log(`   Expected slug: ${testPkg.expectedSlug}`);
        console.log(`   Actual slug:   ${createdPackage.slug}`);
        console.log(`   Match: ${createdPackage.slug === testPkg.expectedSlug ? '✅' : '❌'}`);
        
        // Verify webhook compatibility
        if (createdPackage.slug) {
          console.log(`   📡 Webhook compatible: ✅`);
        } else {
          console.log(`   📡 Webhook compatible: ❌ (No slug field)`);
        }
      } else {
        console.log(`❌ Failed to create package: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating package: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }

  // Test by directly querying the database
  console.log('🔍 Checking Database for Generated Slugs...\n');
  
  try {
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, data_amount, days, slug')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }

    console.log('📦 Recent packages in database:');
    packages.forEach(pkg => {
      console.log(`${pkg.name}:`);
      console.log(`  Country: ${pkg.country_name} (${pkg.country_code})`);
      console.log(`  Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log(`  Slug: ${pkg.slug || 'NO SLUG'}`);
      console.log(`  Webhook Ready: ${pkg.slug ? '✅' : '❌'}`);
      console.log('');
    });

    // Check for packages without slugs
    const { data: packagesWithoutSlugs, error: slugError } = await supabase
      .from('my_packages')
      .select('id, name, country_name')
      .or('slug.is.null,slug.eq.')
      .limit(5);

    if (slugError) {
      console.error('❌ Error checking packages without slugs:', slugError);
      return;
    }

    if (packagesWithoutSlugs && packagesWithoutSlugs.length > 0) {
      console.log('⚠️  Packages still missing slugs:');
      packagesWithoutSlugs.forEach(pkg => {
        console.log(`  - ${pkg.name} (${pkg.country_name})`);
      });
      console.log('\n💡 These packages will need the comprehensive fix applied.');
    } else {
      console.log('✅ All packages have slugs! Webhook delivery should work properly.');
    }

  } catch (error) {
    console.error('❌ Database check error:', error);
  }
}

// Run the test
if (require.main === module) {
  testAdminSlugGeneration()
    .then(() => console.log('\n✅ Test completed!'))
    .catch(error => console.error('\n❌ Test failed:', error));
}

module.exports = { testAdminSlugGeneration }; 