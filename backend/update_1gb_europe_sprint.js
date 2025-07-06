const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function update1GbEuropeSprint() {
  try {
    console.log('🔍 Updating 1GB Europe Sprint package to most-popular...');
    
    // Update the 1GB Europe Sprint package
    const { data: updateResult, error: updateError } = await supabase
      .from('my_packages')
      .update({
        location_slug: 'most-popular',
        show_on_frontend: true,
        visible: true,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', 'EUS')
      .eq('data_amount', 1)
      .eq('days', 30)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating 1GB Europe Sprint package:', updateError);
      return;
    }
    
    console.log(`✅ Successfully updated ${updateResult.length} 1GB Europe Sprint package(s) to most-popular`);
    
    // Verify the update
    const { data: verifyPackages, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'EUS')
      .eq('data_amount', 1)
      .eq('days', 30);
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('\n✅ Verification - Updated packages:');
    verifyPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Location Slug: ${pkg.location_slug}`);
      console.log(`   Show on Frontend: ${pkg.show_on_frontend}`);
      console.log(`   Visible: ${pkg.visible}`);
      console.log(`   Price: €${pkg.sale_price}`);
      console.log('   ---');
    });
    
    // Show all EUS packages after update
    console.log('\n📋 All EUS packages after update:');
    const { data: allEusPackages, error: allEusError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'EUS');
    
    if (!allEusError && allEusPackages) {
      allEusPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log(`   Price: €${pkg.sale_price}`);
        console.log(`   Location Slug: ${pkg.location_slug}`);
        console.log('   ---');
      });
    }
    
    // Test the most-popular endpoint
    console.log('\n🧪 Testing most-popular endpoint...');
    try {
      const response = await fetch('https://esimal.onrender.com/api/packages/get-section-packages?slug=most-popular');
      if (response.ok) {
        const mostPopularPackages = await response.json();
        console.log(`✅ Most popular endpoint returned ${mostPopularPackages.length} packages`);
        
        const eusPackagesInMostPopular = mostPopularPackages.filter(pkg => 
          pkg.country_code === 'EUS'
        );
        
        if (eusPackagesInMostPopular.length > 0) {
          console.log('✅ Europe Sprint packages in most popular section:');
          eusPackagesInMostPopular.forEach((pkg, index) => {
            console.log(`${index + 1}. ${pkg.name} (${pkg.data_amount}GB)`);
            console.log(`   Price: €${pkg.sale_price}`);
          });
        } else {
          console.log('⚠️ No Europe Sprint packages found in most popular section');
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
update1GbEuropeSprint(); 