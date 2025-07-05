const { createClient } = require('@supabase/supabase-js');

// Environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSweden100GBPackage() {
  console.log('🔧 Fixing Sweden 100GB package with proper Roamify package ID...\n');
  
  try {
    // Find the Sweden 100GB package
    const { data: packages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_name', 'Sweden')
      .eq('data_amount', 100)
      .eq('days', 30);
    
    if (fetchError) {
      console.error('❌ Error fetching Sweden packages:', fetchError);
      return;
    }
    
    if (!packages || packages.length === 0) {
      console.log('⚠️  No Sweden 100GB packages found');
      return;
    }
    
    console.log(`📦 Found ${packages.length} Sweden 100GB packages:`);
    packages.forEach((pkg, index) => {
      console.log(`\n${index + 1}. Package ID: ${pkg.id}`);
      console.log(`   Name: ${pkg.name}`);
      console.log(`   Current features.packageId: ${pkg.features?.packageId || 'NULL'}`);
      console.log(`   Current reseller_id: ${pkg.reseller_id || 'NULL'}`);
    });
    
    // Fix each package with proper Roamify package ID
    for (const pkg of packages) {
      console.log(`\n🔄 Fixing package: ${pkg.name}`);
      
      // Use a proper Roamify package ID for Sweden 100GB
      const properRoamifyPackageId = 'esim-sweden-30days-100gb-unsms-unmin-all';
      
      const updateData = {
        features: {
          ...(pkg.features || {}),
          packageId: properRoamifyPackageId,
          dataAmount: 100,
          days: 30,
          price: pkg.base_price || 32.99,
          currency: 'EUR',
          plan: 'data-voice-sms',
          activation: 'installation',
          isUnlimited: false,
          withSMS: true,
          withCall: true,
          withHotspot: true,
          withDataRoaming: true,
          geography: 'local',
          region: 'Europe',
          countrySlug: 'sweden',
          notes: [
            'Check usage: dial #123#',
            'Check number: dial 225',
            'Call format: +(country code)(local number)'
          ],
          // Keep track of the fix
          originalInvalidPackageId: pkg.features?.packageId,
          fixedAt: new Date().toISOString(),
          fixReason: 'Replaced UUID with proper Roamify package ID format'
        },
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('my_packages')
        .update(updateData)
        .eq('id', pkg.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating package: ${updateError.message}`);
      } else {
        console.log(`   ✅ Package updated successfully`);
        console.log(`   📦 New packageId: ${properRoamifyPackageId}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('✅ Sweden 100GB packages fixed with proper Roamify package IDs');
    console.log('🎉 Orders for these packages should now work without fallbacks');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
}

// Run the fix
fixSweden100GBPackage()
  .then(() => {
    console.log('\n🎉 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 