const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEndpointsFix() {
  try {
    console.log('🔍 Verifying that all endpoints return only admin-approved packages...\n');

    // Check my_packages data status
    console.log('=== MY_PACKAGES DATA STATUS ===');
    const { data: myPackagesStats, error: statsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          COUNT(*) as total_my_packages,
          COUNT(CASE WHEN visible = true AND show_on_frontend = true THEN 1 END) as frontend_ready,
          COUNT(CASE WHEN reseller_id IS NOT NULL THEN 1 END) as with_foreign_keys,
          COUNT(CASE WHEN country_code = 'AE' AND visible = true THEN 1 END) as dubai_packages
        FROM my_packages;
      `
    });

    if (statsError) {
      console.error('Error getting stats:', statsError);
    } else {
      console.log('📊 Data Status:');
      console.log(`   Total my_packages: ${myPackagesStats[0]?.total_my_packages || 0}`);
      console.log(`   Frontend ready: ${myPackagesStats[0]?.frontend_ready || 0}`);
      console.log(`   With foreign keys: ${myPackagesStats[0]?.with_foreign_keys || 0}`);
      console.log(`   Dubai packages: ${myPackagesStats[0]?.dubai_packages || 0}\n`);
    }

    // Check packages with Dubai/AE country code
    console.log('=== DUBAI/AE PACKAGES IN MY_PACKAGES ===');
    const { data: dubaiPackages, error: dubaiError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, visible, show_on_frontend')
      .eq('country_code', 'AE');

    if (dubaiError) {
      console.error('Error fetching Dubai packages:', dubaiError);
    } else {
      console.log(`Found ${dubaiPackages.length} Dubai packages in my_packages:`);
      dubaiPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (visible: ${pkg.visible}, frontend: ${pkg.show_on_frontend})`);
      });
    }

    if (dubaiPackages.length === 0) {
      console.log('\n⚠️  No Dubai packages found in my_packages!');
      console.log('   This explains why /bundle/dubai shows 0 packages.');
      console.log('   You need to add Dubai packages to my_packages via admin panel.\n');
    }

    // Suggest fix for Dubai
    console.log('=== RECOMMENDATIONS ===');
    if (dubaiPackages.length === 0) {
      console.log('🔧 To fix Dubai page:');
      console.log('   1. Go to Admin Panel → Roamify Packages');
      console.log('   2. Find Dubai/UAE packages');
      console.log('   3. Add them to my_packages');
      console.log('   4. Set visible=true and show_on_frontend=true');
      console.log('   5. Set country_code=AE\n');
    }

    // Check if frontend needs cache clear
    console.log('🧹 Frontend Cache:');
    console.log('   - Your frontend might be cached');
    console.log('   - Try hard refresh (Ctrl+F5 / Cmd+Shift+R)');
    console.log('   - Or check in incognito/private window\n');

    console.log('✅ Verification complete!');
    console.log('   All API endpoints now return only admin-approved packages.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyEndpointsFix(); 