const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAlbaniaPackage() {
  console.log('🔍 Checking Albania package...\n');

  try {
    // Find the specific Albania package that's failing
    const packageId = '4b4a4e93-b2e2-4f55-bee4-309f0a949a1e';
    
    console.log(`📦 Looking for package ID: ${packageId}`);
    
    const { data: albaniaPackage, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching Albania package:', fetchError);
      return;
    }

    if (!albaniaPackage) {
      console.log('❌ Albania package not found');
      return;
    }

    console.log('📦 Found Albania package:');
    console.log(`  - ID: ${albaniaPackage.id}`);
    console.log(`  - Name: ${albaniaPackage.name}`);
    console.log(`  - Slug: ${albaniaPackage.slug || 'MISSING'}`);
    console.log(`  - Country: ${albaniaPackage.country_name}`);
    console.log(`  - Data: ${albaniaPackage.data_amount}GB, Days: ${albaniaPackage.days}`);
    console.log(`  - Has slug: ${!!albaniaPackage.slug}`);

    // Check all Albania packages
    console.log('\n🇦🇱 All Albania packages in database:');
    const { data: allAlbaniaPackages, error: allError } = await supabase
      .from('my_packages')
      .select('*')
      .ilike('country_name', '%albania%')
      .order('name', { ascending: true });

    if (allError) {
      console.error('❌ Error fetching all Albania packages:', allError);
      return;
    }

    console.log(`Found ${allAlbaniaPackages.length} Albania packages:`);
    allAlbaniaPackages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ID: ${pkg.id}`);
      console.log(`     Name: ${pkg.name}`);
      console.log(`     Slug: ${pkg.slug || 'MISSING'}`);
      console.log(`     Country: ${pkg.country_name}`);
      console.log(`     Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log('');
    });

    // Check packages table too
    console.log('📦 Checking packages table for Albania packages...');
    const { data: packagesTableAlbania, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .ilike('country_name', '%albania%')
      .order('name', { ascending: true });

    if (packagesError) {
      console.error('❌ Error fetching from packages table:', packagesError);
    } else {
      console.log(`Found ${packagesTableAlbania.length} Albania packages in packages table:`);
      packagesTableAlbania.forEach((pkg, index) => {
        console.log(`  ${index + 1}. ID: ${pkg.id}`);
        console.log(`     Name: ${pkg.name}`);
        console.log(`     Slug: ${pkg.slug || 'MISSING'}`);
        console.log(`     Country: ${pkg.country_name}`);
        console.log(`     Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`1. Package ${packageId} is missing its slug field`);
    console.log('2. Need to determine the correct Roamify slug for Albania packages');
    console.log('3. Should check what Roamify expects for Albania package IDs');

  } catch (error) {
    console.error('❌ Error checking Albania package:', error);
  }
}

checkAlbaniaPackage().catch(console.error); 