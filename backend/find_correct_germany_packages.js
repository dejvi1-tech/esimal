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

async function findCorrectGermanyPackages() {
  console.log('🔍 Finding correct Germany package IDs from Roamify API...\n');
  
  try {
    // Step 1: Fetch all packages from Roamify
    console.log('📡 Fetching packages from Roamify API...');
    const response = await axios.get(`${process.env.ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${process.env.ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const countries = response.data.data?.packages || [];
    console.log(`✅ Found ${countries.length} countries from Roamify\n`);

    // Step 2: Find Germany packages
    const germanyCountries = countries.filter(country => 
      country.countryName?.toLowerCase().includes('germany') ||
      country.countryName?.toLowerCase().includes('deutschland') ||
      country.countryCode?.toLowerCase() === 'de'
    );

    console.log('🇩🇪 Germany packages found:');
    console.log('='.repeat(50));

    let germanyPackages = [];
    germanyCountries.forEach(country => {
      console.log(`\n📍 Country: ${country.countryName} (${country.countryCode})`);
      console.log(`   Region: ${country.region}`);
      
      if (country.packages && Array.isArray(country.packages)) {
        country.packages.forEach((pkg, index) => {
          console.log(`\n   ${index + 1}. Package ID: ${pkg.packageId}`);
          console.log(`      Name: ${pkg.package}`);
          console.log(`      Data: ${pkg.dataAmount} ${pkg.dataUnit}`);
          console.log(`      Days: ${pkg.day} days`);
          console.log(`      Price: €${pkg.price}`);
          
          germanyPackages.push({
            packageId: pkg.packageId,
            name: pkg.package,
            country: country.countryName,
            countryCode: country.countryCode,
            dataAmount: pkg.dataAmount,
            dataUnit: pkg.dataUnit,
            days: pkg.day,
            price: pkg.price
          });
        });
      }
    });

    // Step 3: Find 1GB Germany packages specifically
    console.log('\n\n🎯 1GB Germany packages (candidates for your package):');
    console.log('='.repeat(60));

    const oneGBPackages = germanyPackages.filter(pkg => 
      (pkg.dataAmount === 1 && pkg.dataUnit === 'GB') ||
      (pkg.dataAmount === 1024 && pkg.dataUnit === 'MB') ||
      pkg.name?.toLowerCase().includes('1gb')
    );

    if (oneGBPackages.length > 0) {
      oneGBPackages.forEach((pkg, index) => {
        console.log(`\n${index + 1}. ✅ CANDIDATE: ${pkg.packageId}`);
        console.log(`   Name: ${pkg.name}`);
        console.log(`   Data: ${pkg.dataAmount} ${pkg.dataUnit}`);
        console.log(`   Days: ${pkg.days} days`);
        console.log(`   Price: €${pkg.price}`);
      });

      // Step 4: Update your package
      console.log('\n\n🔧 Updating your package with correct Germany package ID...');
      
      // Use the first 1GB Germany package found
      const correctPackageId = oneGBPackages[0].packageId;
      
      const { error: updateError } = await supabase
        .from('my_packages')
        .update({
          features: {
            packageId: correctPackageId,
            originalPackageId: 'esim-de-30days-1gb-all',
            fallbackPackageId: 'esim-europe-30days-3gb-all',
            correctedAt: new Date().toISOString(),
            correctionReason: 'Updated to use real Germany 1GB package from Roamify API'
          }
        })
        .eq('id', 'cd837948-dcab-487b-b080-4112e5c3d0e6');

      if (updateError) {
        console.error('❌ Error updating package:', updateError);
      } else {
        console.log(`✅ Updated package cd837948-dcab-487b-b080-4112e5c3d0e6`);
        console.log(`   New Package ID: ${correctPackageId}`);
        console.log(`   Package Name: ${oneGBPackages[0].name}`);
        console.log('\n🎉 Germany orders should now get real Germany packages!');
      }
    } else {
      console.log('\n⚠️  No 1GB Germany packages found. Available options:');
      germanyPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.packageId} - ${pkg.dataAmount}${pkg.dataUnit} - €${pkg.price}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
findCorrectGermanyPackages().catch(console.error); 