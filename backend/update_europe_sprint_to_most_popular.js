const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEuropeSprintToMostPopular() {
  try {
    console.log('🔍 Searching for Europe Sprint package with country_code EUS...');
    
    // First, let's find the Europe Sprint package
    const { data: europeSprintPackages, error: searchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'EUS');
    
    if (searchError) {
      console.error('❌ Error searching for Europe Sprint packages:', searchError);
      return;
    }
    
    if (!europeSprintPackages || europeSprintPackages.length === 0) {
      console.log('❌ No packages found with country_code EUS');
      
      // Let's also search by name to see if there are any Europe Sprint packages
      const { data: europeSprintByName, error: nameSearchError } = await supabase
        .from('my_packages')
        .select('*')
        .ilike('name', '%Europe Sprint%');
      
      if (nameSearchError) {
        console.error('❌ Error searching by name:', nameSearchError);
        return;
      }
      
      if (europeSprintByName && europeSprintByName.length > 0) {
        console.log(`\n📦 Found ${europeSprintByName.length} packages with "Europe Sprint" in name:`);
        europeSprintByName.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.name}`);
          console.log(`   ID: ${pkg.id}`);
          console.log(`   Country: ${pkg.country_name}`);
          console.log(`   Country Code: ${pkg.country_code}`);
          console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
          console.log(`   Price: €${pkg.sale_price}`);
          console.log(`   Location Slug: ${pkg.location_slug}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ No packages found with "Europe Sprint" in name either');
        
        // Let's show all packages to see what's available
        const { data: allPackages, error: allError } = await supabase
          .from('my_packages')
          .select('*')
          .limit(10);
        
        if (!allError && allPackages) {
          console.log('\n📋 Sample of available packages:');
          allPackages.forEach((pkg, index) => {
            console.log(`${index + 1}. ${pkg.name}`);
            console.log(`   Country: ${pkg.country_name}`);
            console.log(`   Country Code: ${pkg.country_code}`);
            console.log(`   Location Slug: ${pkg.location_slug}`);
            console.log('   ---');
          });
        }
      }
      return;
    }
    
    console.log(`✅ Found ${europeSprintPackages.length} Europe Sprint package(s):`);
    europeSprintPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Country: ${pkg.country_name}`);
      console.log(`   Country Code: ${pkg.country_code}`);
      console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log(`   Price: €${pkg.sale_price}`);
      console.log(`   Current Location Slug: ${pkg.location_slug}`);
      console.log('   ---');
    });
    
    // Update all Europe Sprint packages to have most-popular location_slug
    console.log('\n🔄 Updating Europe Sprint packages to most-popular...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('my_packages')
      .update({
        location_slug: 'most-popular',
        show_on_frontend: true,
        visible: true,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'EUS')
      .select();
    
    if (updateError) {
      console.error('❌ Error updating packages:', updateError);
      return;
    }
    
    console.log(`✅ Successfully updated ${updateResult.length} Europe Sprint package(s) to most-popular`);
    
    // Verify the update
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'EUS');
    
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
          pkg.country_code === 'EUS' || pkg.name.includes('Europe Sprint')
        );
        
        if (europeSprintInMostPopular.length > 0) {
          console.log('✅ Europe Sprint package is now in most popular section!');
          europeSprintInMostPopular.forEach((pkg, index) => {
            console.log(`${index + 1}. ${pkg.name} (${pkg.country_code})`);
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
updateEuropeSprintToMostPopular(); 