const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEuropeSprintSpecificPackage() {
  try {
    console.log('🔍 Searching for Europe Sprint package with reseller_id: esim-eus-30days-1gb-all...');
    
    // First, let's find the specific Europe Sprint package
    const { data: europeSprintPackages, error: searchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('reseller_id', 'esim-eus-30days-1gb-all');
    
    if (searchError) {
      console.error('❌ Error searching for Europe Sprint packages:', searchError);
      return;
    }
    
    if (!europeSprintPackages || europeSprintPackages.length === 0) {
      console.log('❌ No packages found with reseller_id: esim-eus-30days-1gb-all');
      
      // Let's also search by country_code EUS to see what packages exist
      const { data: eusPackages, error: eusError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('country_code', 'EUS');
      
      if (eusError) {
        console.error('❌ Error searching for EUS packages:', eusError);
        return;
      }
      
      if (eusPackages && eusPackages.length > 0) {
        console.log(`\n📦 Found ${eusPackages.length} packages with country_code EUS:`);
        eusPackages.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.name}`);
          console.log(`   ID: ${pkg.id}`);
          console.log(`   Reseller ID: ${pkg.reseller_id}`);
          console.log(`   Country: ${pkg.country_name}`);
          console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
          console.log(`   Price: €${pkg.sale_price}`);
          console.log(`   Location Slug: ${pkg.location_slug}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ No packages found with country_code EUS either');
      }
      return;
    }
    
    console.log(`✅ Found ${europeSprintPackages.length} Europe Sprint package(s):`);
    europeSprintPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Reseller ID: ${pkg.reseller_id}`);
      console.log(`   Country: ${pkg.country_name}`);
      console.log(`   Country Code: ${pkg.country_code}`);
      console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log(`   Price: €${pkg.sale_price}`);
      console.log(`   Current Location Slug: ${pkg.location_slug}`);
      console.log('   ---');
    });
    
    // Update the specific Europe Sprint package to have most-popular location_slug
    console.log('\n🔄 Updating Europe Sprint package to most-popular...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('my_packages')
      .update({
        location_slug: 'most-popular',
        show_on_frontend: true,
        visible: true,
        updated_at: new Date().toISOString()
      })
      .eq('reseller_id', 'esim-eus-30days-1gb-all')
      .select();
    
    if (updateError) {
      console.error('❌ Error updating package:', updateError);
      return;
    }
    
    console.log(`✅ Successfully updated ${updateResult.length} Europe Sprint package(s) to most-popular`);
    
    // Verify the update
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('reseller_id', 'esim-eus-30days-1gb-all');
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('\n✅ Verification - Updated packages:');
    verifyPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   Location Slug: ${pkg.location_slug}`);
      console.log(`   Show on Frontend: ${pkg.show_on_frontend}`);
      console.log(`   Visible: ${pkg.visible}`);
      console.log('   ---');
    });
    
    // Test the most-popular endpoint
    console.log('\n🧪 Testing most-popular endpoint...');
    try {
      const response = await fetch('https://esimal.onrender.com/api/packages/get-section-packages?slug=most-popular');
      if (response.ok) {
        const mostPopularPackages = await response.json();
        console.log(`✅ Most popular endpoint returned ${mostPopularPackages.length} packages`);
        
        const europeSprintInMostPopular = mostPopularPackages.filter(pkg => 
          pkg.reseller_id === 'esim-eus-30days-1gb-all' || 
          pkg.country_code === 'EUS'
        );
        
        if (europeSprintInMostPopular.length > 0) {
          console.log('✅ Europe Sprint package is now in most popular section!');
          europeSprintInMostPopular.forEach((pkg, index) => {
            console.log(`${index + 1}. ${pkg.name} (${pkg.country_code})`);
            console.log(`   Reseller ID: ${pkg.reseller_id}`);
          });
        } else {
          console.log('⚠️ Europe Sprint package not found in most popular section yet');
        }
      } else {
        console.log('❌ Most popular endpoint returned error:', response.status);
      }
    } catch (error) {
      console.error('❌ Error testing most-popular endpoint:', error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
updateEuropeSprintSpecificPackage(); 