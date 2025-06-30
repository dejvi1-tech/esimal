const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreatePackages() {
  console.log('🔍 Checking Albania and Germany packages...\n');

  try {
    // Check Albania packages
    console.log('Checking Albania (AL) packages...');
    const { data: albaniaPackages, error: alError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'AL')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (alError) {
      console.error('❌ Error fetching Albania packages:', alError);
    } else {
      console.log(`✅ Found ${albaniaPackages?.length || 0} Albania packages`);
      if (albaniaPackages && albaniaPackages.length > 0) {
        albaniaPackages.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.name} - ${pkg.sale_price}€`);
        });
      }
    }

    // Check Germany packages
    console.log('\nChecking Germany (DE) packages...');
    const { data: germanyPackages, error: deError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('country_code', 'DE')
      .eq('visible', true)
      .eq('show_on_frontend', true);

    if (deError) {
      console.error('❌ Error fetching Germany packages:', deError);
    } else {
      console.log(`✅ Found ${germanyPackages?.length || 0} Germany packages`);
      if (germanyPackages && germanyPackages.length > 0) {
        germanyPackages.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.name} - ${pkg.sale_price}€`);
        });
      }
    }

    // If no packages found, create them based on the Europe packages
    if ((!albaniaPackages || albaniaPackages.length === 0) || (!germanyPackages || germanyPackages.length === 0)) {
      console.log('\n📦 Creating missing packages...');
      
      // Get Europe packages as template
      const { data: europePackages, error: euError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('country_code', 'EU')
        .eq('visible', true)
        .eq('show_on_frontend', true)
        .limit(5);

      if (euError) {
        console.error('❌ Error fetching Europe packages:', euError);
        return;
      }

      if (!europePackages || europePackages.length === 0) {
        console.log('❌ No Europe packages found to use as template');
        return;
      }

      // Create Albania packages if missing
      if (!albaniaPackages || albaniaPackages.length === 0) {
        console.log('\n🇦🇱 Creating Albania packages...');
        for (const euPkg of europePackages) {
          const albaniaPackage = {
            id: `esim-albania-${euPkg.validity_days}days-${euPkg.data_amount}mb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: euPkg.name,
            country_name: 'Albania',
            data_amount: euPkg.data_amount,
            validity_days: euPkg.validity_days,
            base_price: euPkg.base_price,
            sale_price: euPkg.sale_price,
            profit: euPkg.profit,
            visible: true,
            reseller_id: euPkg.reseller_id.replace('europe-us', 'albania'),
            region: 'Europe',
            country_code: 'AL',
            location_slug: 'albania',
            show_on_frontend: true,
            homepage_order: euPkg.homepage_order
          };

          const { error: insertError } = await supabase
            .from('my_packages')
            .insert(albaniaPackage);

          if (insertError) {
            console.error(`❌ Error creating Albania package:`, insertError);
          } else {
            console.log(`✅ Created Albania package: ${albaniaPackage.name} - ${albaniaPackage.sale_price}€`);
          }
        }
      }

      // Create Germany packages if missing
      if (!germanyPackages || germanyPackages.length === 0) {
        console.log('\n🇩🇪 Creating Germany packages...');
        for (const euPkg of europePackages) {
          const germanyPackage = {
            id: `esim-germany-${euPkg.validity_days}days-${euPkg.data_amount}mb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: euPkg.name,
            country_name: 'Germany',
            data_amount: euPkg.data_amount,
            validity_days: euPkg.validity_days,
            base_price: euPkg.base_price,
            sale_price: euPkg.sale_price,
            profit: euPkg.profit,
            visible: true,
            reseller_id: euPkg.reseller_id.replace('europe-us', 'germany'),
            region: 'Europe',
            country_code: 'DE',
            location_slug: 'germany',
            show_on_frontend: true,
            homepage_order: euPkg.homepage_order
          };

          const { error: insertError } = await supabase
            .from('my_packages')
            .insert(germanyPackage);

          if (insertError) {
            console.error(`❌ Error creating Germany package:`, insertError);
          } else {
            console.log(`✅ Created Germany package: ${germanyPackage.name} - ${germanyPackage.sale_price}€`);
          }
        }
      }

      console.log('\n✅ Package creation completed!');
    } else {
      console.log('\n✅ Both Albania and Germany packages already exist!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndCreatePackages(); 