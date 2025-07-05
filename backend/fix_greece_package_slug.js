const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGreecePackageSlug() {
  console.log('🔧 Fixing Greece package slug...\n');

  try {
    // Find the Greece package with the wrong slug
    const { data: greecePackage, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('slug', 'esim-gr-30days-1gb-all')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching Greece package:', fetchError);
      return;
    }

    if (!greecePackage) {
      console.log('❌ Greece package with slug "esim-gr-30days-1gb-all" not found');
      return;
    }

    console.log('📦 Found Greece package to fix:');
    console.log(`  - ID: ${greecePackage.id}`);
    console.log(`  - Name: ${greecePackage.name}`);
    console.log(`  - Current Slug: ${greecePackage.slug}`);
    console.log(`  - Country: ${greecePackage.country_name}`);
    console.log(`  - Data: ${greecePackage.data_amount}GB, Days: ${greecePackage.days}`);

    // Update the slug to the working format
    const newSlug = 'esim-greece-30days-1gb-all';
    
    console.log(`\n🔄 Updating slug from "${greecePackage.slug}" to "${newSlug}"...`);

    const { data: updatedPackage, error: updateError } = await supabase
      .from('my_packages')
      .update({ 
        slug: newSlug,
        updated_at: new Date().toISOString()
      })
      .eq('id', greecePackage.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating Greece package slug:', updateError);
      return;
    }

    console.log('✅ Greece package slug updated successfully!');
    console.log(`  - New Slug: ${updatedPackage.slug}`);
    console.log(`  - Updated At: ${updatedPackage.updated_at}`);

    // Also update the packages table if it exists there
    console.log('\n📦 Checking packages table for the same package...');
    const { data: packagesTablePackage, error: packagesFetchError } = await supabase
      .from('packages')
      .select('*')
      .eq('slug', 'esim-gr-30days-1gb-all')
      .single();

    if (packagesFetchError && packagesFetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching from packages table:', packagesFetchError);
    } else if (packagesTablePackage) {
      console.log('📦 Found matching package in packages table, updating...');
      
      const { data: updatedPackagesPackage, error: packagesUpdateError } = await supabase
        .from('packages')
        .update({ 
          slug: newSlug,
          updated_at: new Date().toISOString()
        })
        .eq('id', packagesTablePackage.id)
        .select()
        .single();

      if (packagesUpdateError) {
        console.error('❌ Error updating packages table:', packagesUpdateError);
      } else {
        console.log('✅ Packages table updated successfully!');
        console.log(`  - New Slug: ${updatedPackagesPackage.slug}`);
      }
    } else {
      console.log('ℹ️ No matching package found in packages table');
    }

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const { data: verifyPackage, error: verifyError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('slug', newSlug)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log('✅ Verification successful!');
      console.log(`  - Package found with new slug: ${verifyPackage.slug}`);
      console.log(`  - Package ID: ${verifyPackage.id}`);
    }

    console.log('\n📋 SUMMARY:');
    console.log('✅ Greece package slug fixed from "esim-gr-30days-1gb-all" to "esim-greece-30days-1gb-all"');
    console.log('✅ This should resolve the Roamify API 500 error');
    console.log('✅ Future orders for Greece should work correctly');

  } catch (error) {
    console.error('❌ Error fixing Greece package slug:', error);
  }
}

fixGreecePackageSlug().catch(console.error); 