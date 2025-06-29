const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as your deployed app
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4NjI4NiwiZXhwIjoyMDY0NTYyMjg2fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPackageMapping() {
  console.log('🔧 Fixing package mapping...\n');

  try {
    // Step 1: Check current state
    console.log('📦 Checking current my_packages...');
    const { data: myPackages, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id, location_slug')
      .limit(10);

    if (myPackagesError) {
      console.error('Error fetching my_packages:', myPackagesError);
      return;
    }

    console.log('Current my_packages:');
    myPackages.forEach(pkg => {
      console.log(`  - ${pkg.id} | reseller_id: ${pkg.reseller_id || 'NULL'}`);
    });

    // Step 2: Check packages table
    console.log('\n📦 Checking packages table...');
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, name, reseller_id, features')
      .limit(10);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return;
    }

    console.log('Current packages:');
    packages.forEach(pkg => {
      console.log(`  - ${pkg.id} | reseller_id: ${pkg.reseller_id || 'NULL'} | packageId: ${pkg.features?.packageId || 'NULL'}`);
    });

    // Step 3: Fix the mapping by updating reseller_id in my_packages
    console.log('\n🔧 Fixing reseller_id mapping...');
    
    for (const myPkg of myPackages) {
      if (!myPkg.reseller_id) {
        // Set reseller_id to the package ID itself as a fallback
        const { error: updateError } = await supabase
          .from('my_packages')
          .update({ reseller_id: myPkg.id })
          .eq('id', myPkg.id);

        if (updateError) {
          console.error(`Error updating reseller_id for ${myPkg.id}:`, updateError);
        } else {
          console.log(`✅ Updated reseller_id for ${myPkg.id} to ${myPkg.id}`);
        }
      }
    }

    // Step 4: Create corresponding records in packages table if they don't exist
    console.log('\n🔧 Creating missing packages records...');
    
    for (const myPkg of myPackages) {
      // Check if this package exists in packages table
      const { data: existingPackage, error: checkError } = await supabase
        .from('packages')
        .select('id')
        .eq('reseller_id', myPkg.reseller_id || myPkg.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Package doesn't exist, create it
        const { error: insertError } = await supabase
          .from('packages')
          .insert({
            name: myPkg.name,
            reseller_id: myPkg.reseller_id || myPkg.id,
            features: {
              packageId: myPkg.reseller_id || myPkg.id // Use the ID as the Roamify packageId for now
            },
            is_active: true
          });

        if (insertError) {
          console.error(`Error creating package for ${myPkg.id}:`, insertError);
        } else {
          console.log(`✅ Created package record for ${myPkg.id}`);
        }
      } else if (checkError) {
        console.error(`Error checking package ${myPkg.id}:`, checkError);
      } else {
        console.log(`✅ Package already exists for ${myPkg.id}`);
      }
    }

    console.log('\n🎉 Package mapping fix completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Run the syncRoamifyPackages endpoint to get real Roamify packageIds');
    console.log('2. Update the packages table with real Roamify data');
    console.log('3. Test a purchase flow');

  } catch (error) {
    console.error('Error fixing package mapping:', error);
  }
}

fixPackageMapping().catch(console.error); 