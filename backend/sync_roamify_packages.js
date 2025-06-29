const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

if (!ROAMIFY_API_KEY) {
  console.error('Missing ROAMIFY_API_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncRoamifyPackages() {
  console.log('Syncing Roamify packages to packages table...\n');

  try {
    // Step 1: Fetch packages from Roamify API
    console.log('Fetching packages from Roamify API...');
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (response.status !== 200) {
      throw new Error(`Roamify API returned status ${response.status}`);
    }

    // Extract packages from the correct response structure
    const roamifyPackages = response.data?.data?.packages || [];
    console.log(`Found ${roamifyPackages.length} packages from Roamify API`);

    if (roamifyPackages.length === 0) {
      console.log('No packages found from Roamify API');
      return;
    }

    // Step 2: Transform Roamify packages to our format
    console.log('Transforming packages...');
    const transformedPackages = roamifyPackages.map(pkg => ({
      id: pkg.packageId, // Use packageId as the primary ID
      name: pkg.name || pkg.packageId,
      slug: pkg.packageId, // Use packageId as slug
      reseller_id: pkg.packageId, // Use packageId as reseller_id for mapping
      features: {
        packageId: pkg.packageId, // Store the real Roamify packageId
        dataAmount: pkg.dataAmount,
        validityDays: pkg.validityDays,
        price: pkg.price,
        currency: pkg.currency,
        countries: pkg.countries || [],
        description: pkg.description,
        isUnlimited: pkg.isUnlimited || false,
      },
      data_amount: pkg.dataAmount || 0,
      validity_days: pkg.validityDays || 30,
      base_price: pkg.price || 0,
      sale_price: pkg.price || 0, // Initially same as base price
      country_name: pkg.countryName || 'Global',
      region: pkg.region || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      visible: true,
      is_active: true,
    }));

    console.log(`Transformed ${transformedPackages.length} packages`);

    // Step 3: Clear existing packages (optional - comment out if you want to keep existing)
    console.log('Clearing existing packages from packages table...');
    const { error: deleteError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

    if (deleteError) {
      console.error('Error clearing packages table:', deleteError);
      return;
    }

    // Step 4: Insert new packages
    console.log('Inserting packages into packages table...');
    const { data: insertedPackages, error: insertError } = await supabase
      .from('packages')
      .insert(transformedPackages)
      .select();

    if (insertError) {
      console.error('Error inserting packages:', insertError);
      return;
    }

    console.log(`Successfully synced ${insertedPackages.length} packages to packages table`);

    // Step 5: Show some examples
    console.log('\n=== SYNCED PACKAGES EXAMPLES ===');
    insertedPackages.slice(0, 10).forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Real Roamify Package ID: ${pkg.features.packageId}`);
      console.log(`   Data: ${pkg.data_amount}GB, Validity: ${pkg.validity_days} days`);
      console.log(`   Price: ${pkg.base_price} ${pkg.features.currency || 'USD'}`);
      console.log('   ---');
    });

    // Step 6: Show mapping between my_packages and packages
    console.log('\n=== MAPPING BETWEEN MY_PACKAGES AND PACKAGES ===');
    const { data: myPackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null);

    if (myPackages && myPackages.length > 0) {
      console.log(`Found ${myPackages.length} my_packages with reseller_id`);
      
      myPackages.slice(0, 10).forEach((myPkg, index) => {
        const matchingPackage = insertedPackages.find(pkg => pkg.reseller_id === myPkg.reseller_id);
        console.log(`${index + 1}. My Package: ${myPkg.name} (${myPkg.reseller_id})`);
        if (matchingPackage) {
          console.log(`   ✓ Matches Package: ${matchingPackage.name} (${matchingPackage.features.packageId})`);
        } else {
          console.log(`   ✗ No matching package found in packages table`);
        }
        console.log('   ---');
      });
    }

    console.log('\n=== SYNC COMPLETE ===');
    console.log('Now your system can use real Roamify package IDs for orders!');
    console.log('The packages table contains the real Roamify packages.');
    console.log('The my_packages table contains your pricing and display settings.');

  } catch (error) {
    console.error('Error syncing Roamify packages:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

syncRoamifyPackages().catch(console.error); 