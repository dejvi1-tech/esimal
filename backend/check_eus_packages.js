const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEusPackages() {
  try {
    console.log('🔍 Checking all packages with country_code EUS...');
    
    // Get all packages with country_code EUS
    const { data: eusPackages, error: eusError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'EUS');
    
    if (eusError) {
      console.error('❌ Error searching for EUS packages:', eusError);
      return;
    }
    
    if (!eusPackages || eusPackages.length === 0) {
      console.log('❌ No packages found with country_code EUS');
      return;
    }
    
    console.log(`✅ Found ${eusPackages.length} packages with country_code EUS:`);
    eusPackages.forEach((pkg, index) => {
      console.log(`\n${index + 1}. ${pkg.name}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Reseller ID: ${pkg.reseller_id}`);
      console.log(`   Country: ${pkg.country_name}`);
      console.log(`   Country Code: ${pkg.country_code}`);
      console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
      console.log(`   Price: €${pkg.sale_price}`);
      console.log(`   Location Slug: ${pkg.location_slug}`);
      console.log(`   Show on Frontend: ${pkg.show_on_frontend}`);
      console.log(`   Visible: ${pkg.visible}`);
      console.log('   ---');
    });
    
    // Also check if there are any packages with "1gb" in the name or reseller_id
    console.log('\n🔍 Searching for packages with "1gb" in name or reseller_id...');
    const { data: oneGbPackages, error: oneGbError } = await supabase
      .from('my_packages')
      .select('*')
      .or('name.ilike.%1gb%,reseller_id.ilike.%1gb%')
      .limit(10);
    
    if (oneGbError) {
      console.error('❌ Error searching for 1GB packages:', oneGbError);
    } else if (oneGbPackages && oneGbPackages.length > 0) {
      console.log(`\n📦 Found ${oneGbPackages.length} packages with "1gb" in name or reseller_id:`);
      oneGbPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name}`);
        console.log(`   ID: ${pkg.id}`);
        console.log(`   Reseller ID: ${pkg.reseller_id}`);
        console.log(`   Country: ${pkg.country_name}`);
        console.log(`   Country Code: ${pkg.country_code}`);
        console.log(`   Data: ${pkg.data_amount}GB, Days: ${pkg.days}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No packages found with "1gb" in name or reseller_id');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkEusPackages(); 