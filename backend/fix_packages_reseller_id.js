const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPackagesResellerId() {
  console.log('Fixing packages table reseller_id mapping...\n');

  try {
    // Get all packages that have features.packageId but null reseller_id
    const { data: packages, error: fetchError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .is('reseller_id', null);

    if (fetchError) {
      console.error('Error fetching packages:', fetchError);
      return;
    }

    console.log(`Found ${packages.length} packages with null reseller_id that need to be updated`);

    if (packages.length === 0) {
      console.log('All packages already have reseller_id set!');
      return;
    }

    // Update each package to set reseller_id = features.packageId
    let updatedCount = 0;
    for (const pkg of packages) {
      if (pkg.features && pkg.features.packageId) {
        const { error: updateError } = await supabase
          .from('packages')
          .update({ reseller_id: pkg.features.packageId })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`Error updating package ${pkg.id}:`, updateError);
        } else {
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} packages...`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} packages with reseller_id`);

    // Verify the mapping works
    console.log('\n=== VERIFYING MAPPING ===');
    const { data: myPackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .not('reseller_id', 'is', null)
      .limit(5);

    if (myPackages && myPackages.length > 0) {
      console.log(`Found ${myPackages.length} my_packages with reseller_id`);
      
      for (const myPkg of myPackages) {
        const { data: matchingPackage } = await supabase
          .from('packages')
          .select('id, name, features')
          .eq('reseller_id', myPkg.reseller_id)
          .single();

        if (matchingPackage) {
          console.log(`✅ ${myPkg.name} (${myPkg.reseller_id}) -> ${matchingPackage.name} (${matchingPackage.features.packageId})`);
        } else {
          console.log(`❌ ${myPkg.name} (${myPkg.reseller_id}) -> No matching package found`);
        }
      }
    }

    console.log('\n🎉 Mapping is now ready! Your backend can use real Roamify package IDs for orders.');

  } catch (error) {
    console.error('Error fixing packages reseller_id:', error);
  }
}

fixPackagesResellerId().catch(console.error); 