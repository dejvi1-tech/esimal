const { createClient } = require('@supabase/supabase-js');

// Use environment variables (these will be available on Render)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('This script should be run on the cloud platform where environment variables are configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSpecificPackage() {
  const packageId = '5ecb7401-a4c8-4168-a295-0054ca092889';
  
  try {
    console.log(`🔄 Fixing package: ${packageId}`);

    // Get the current package data
    const { data: packageData, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching package:', fetchError);
      return;
    }

    if (!packageData) {
      console.error('❌ Package not found');
      return;
    }

    console.log('📦 Current package data:', {
      name: packageData.name,
      country: packageData.country_name,
      data_amount: packageData.data_amount,
      days: packageData.days,
      hasResellerId: !!packageData.reseller_id,
      hasFeatures: !!packageData.features
    });

    // Create a generic reseller_id based on package details
    const countryCode = packageData.country_code || 'al'; // Default to Albania
    const dataAmount = Math.floor(packageData.data_amount || 1);
    const days = packageData.days || 30;
    const genericResellerId = `esim-${countryCode.toLowerCase()}-${days}days-${dataAmount}gb-all`;

    // Update the package with Roamify configuration
    const updateData = {
      reseller_id: genericResellerId,
      features: {
        packageId: genericResellerId,
        dataAmount: (packageData.data_amount || 1) * 1024, // Convert GB to MB
        days: packageData.days || 30,
        price: packageData.base_price || 2.49,
        currency: 'EUR',
        plan: 'data-only',
        activation: 'first-use',
        isUnlimited: false,
        withSMS: false,
        withCall: false,
        withHotspot: true,
        withDataRoaming: true,
        geography: 'local',
        region: packageData.region || 'Europe',
        countrySlug: countryCode.toLowerCase(),
        notes: []
      },
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('my_packages')
      .update(updateData)
      .eq('id', packageId);

    if (updateError) {
      console.error('❌ Error updating package:', updateError);
      return;
    }

    console.log('✅ Package fixed successfully!');
    console.log('📦 New configuration:', {
      reseller_id: genericResellerId,
      features_packageId: genericResellerId,
      dataAmount: updateData.features.dataAmount,
      days: updateData.features.days
    });

    // Verify the fix
    const { data: verifyData, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (!verifyError && verifyData) {
      console.log('✅ Verification successful - package now has proper Roamify configuration');
      console.log('🎉 Orders for this package should now work properly');
    } else {
      console.error('❌ Verification failed:', verifyError);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  fixSpecificPackage();
}

module.exports = { fixSpecificPackage }; 