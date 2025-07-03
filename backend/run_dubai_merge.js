const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDubaiMerge() {
  try {
    console.log('🇦🇪 Starting Dubai and UAE merge migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250103000005_merge_dubai_uae.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, executing...');
    console.log('🔧 This will:');
    console.log('   1. Find all packages with "United Arab Emirates", "UAE", or "Dubai"');
    console.log('   2. Standardize them all to country_name="Dubai", country_code="AE"');
    console.log('   3. Update both my_packages and packages tables');
    console.log('   4. Set location_slug to "dubai" for consistency\n');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    if (data && data.length > 0) {
      console.log('\n📊 Migration Results:');
      data.forEach(result => {
        if (Array.isArray(result)) {
          result.forEach(row => {
            if (row.status || row.check_type) {
              console.log(`   ${row.status || row.check_type}:`);
              if (row.country_name) {
                console.log(`     ${row.country_name} (${row.country_code}): ${row.package_count} packages`);
              } else if (row.total_dubai_packages !== undefined) {
                console.log(`     Total Dubai packages: ${row.total_dubai_packages}`);
                console.log(`     Visible: ${row.visible_packages}`);
                console.log(`     Frontend ready: ${row.frontend_packages}`);
              }
            }
          });
        }
      });
    }
    
    // Test the merge by checking current state
    console.log('\n🧪 Testing merged data...');
    const { data: dubaiPackages, error: testError } = await supabase
      .from('my_packages')
      .select('id, name, country_name, country_code, visible, show_on_frontend')
      .eq('country_code', 'AE')
      .limit(5);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log(`✅ Found ${dubaiPackages.length} Dubai packages after merge:`);
      dubaiPackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.name} (${pkg.country_name}, visible: ${pkg.visible})`);
      });
    }
    
    console.log('\n🎉 Dubai/UAE merge completed!');
    console.log('💡 Now all Dubai and UAE packages are consolidated under "Dubai"');
    console.log('🌐 Your /bundle/dubai page should work properly');
    
  } catch (error) {
    console.error('❌ Unexpected error during merge:', error);
    process.exit(1);
  }
}

runDubaiMerge(); 