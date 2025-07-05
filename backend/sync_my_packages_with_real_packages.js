const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Please provide the service role key to bypass RLS policies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncMyPackagesWithRealPackages() {
  try {
    console.log('🔄 Starting sync of my_packages with real Roamify packages...');

    // Step 1: Get all real packages from packages table
    const { data: realPackages, error: realPackagesError } = await supabase
      .from('packages')
      .select('*')
      .limit(100); // Start with first 100 packages

    if (realPackagesError) {
      console.error('❌ Error fetching real packages:', realPackagesError);
      return;
    }

    console.log(`📦 Found ${realPackages.length} real packages to sync`);

    // Step 2: Get existing my_packages to avoid duplicates
    const { data: existingMyPackages, error: existingError } = await supabase
      .from('my_packages')
      .select('reseller_id');

    if (existingError) {
      console.error('❌ Error fetching existing my_packages:', existingError);
      return;
    }

    const existingResellerIds = new Set(existingMyPackages.map(p => p.reseller_id));
    console.log(`📋 Found ${existingMyPackages.length} existing my_packages`);

    // Step 3: Filter out packages that already exist in my_packages
    const packagesToSync = realPackages.filter(pkg => !existingResellerIds.has(pkg.roamify_package_id));
    console.log(`🔄 Will sync ${packagesToSync.length} new packages to my_packages`);

    if (packagesToSync.length === 0) {
      console.log('✅ All packages already exist in my_packages');
      return;
    }

    // Step 4: Transform real packages to my_packages format
    const myPackagesToInsert = packagesToSync.map(pkg => {
      // Generate slug for Roamify V2 API
      const slug = pkg.features?.packageId || 
                   `esim-${(pkg.country_code || 'global').toLowerCase()}-${pkg.validity_days || 30}days-${Math.floor(pkg.data_amount || 1)}gb-all`;
      
      return {
        id: pkg.id, // Use the same UUID
        name: pkg.name || 'Unknown Package',
        data_amount: pkg.data_amount || 1,
        validity_days: pkg.validity_days || 30,
        sale_price: pkg.sale_price || 5.99,
        country_name: pkg.country_name || 'Unknown',
        country_code: pkg.country_code || 'XX',
        region: pkg.region || 'Unknown',
        reseller_id: pkg.roamify_package_id, // Map roamify_package_id to reseller_id
        location_slug: pkg.roamify_package_id, // Use roamify_package_id as location_slug too
        slug: slug, // Add slug for Roamify V2 API
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Step 5: Insert packages into my_packages table
    const { data: insertedPackages, error: insertError } = await supabase
      .from('my_packages')
      .insert(myPackagesToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error inserting packages into my_packages:', insertError);
      return;
    }

    console.log(`✅ Successfully synced ${insertedPackages.length} packages to my_packages`);
    console.log('📋 Sample synced packages:');
    insertedPackages.slice(0, 3).forEach((pkg, idx) => {
      console.log(`  ${idx + 1}. ${pkg.name} (${pkg.country_name}) - $${pkg.sale_price}`);
    });

    // Step 6: Verify the sync
    const { data: totalMyPackages, error: countError } = await supabase
      .from('my_packages')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`📊 Total my_packages after sync: ${totalMyPackages.length}`);
    }

    console.log('🎉 Sync completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error during sync:', error);
  }
}

// Run the sync
syncMyPackagesWithRealPackages(); 