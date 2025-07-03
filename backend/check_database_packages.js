const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4NjI4NiwiZXhwIjoyMDY0NTYyMjg2fQ.IyeT5sS5hP3gYTge1Z97HuKO1A3FL_pWLbTgMiqXWsE';

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n');

  // Check packages table
  try {
    const { count: packagesCount, error: packagesError } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true });

    if (packagesError) {
      console.error('❌ Error counting packages:', packagesError);
    } else {
      console.log('📦 packages table:');
      console.log(`   Total count: ${packagesCount || 0}`);
    }

    // Check active packages
    const { count: activeCount, error: activeError } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!activeError) {
      console.log(`   Active packages: ${activeCount || 0}`);
    }

    // Get sample packages
    const { data: samplePackages, error: sampleError } = await supabase
      .from('packages')
      .select('*')
      .limit(3);

    if (!sampleError && samplePackages && samplePackages.length > 0) {
      console.log('\n   Sample package:');
      console.log(JSON.stringify(samplePackages[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error checking packages table:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check my_packages table
  try {
    const { count: myPackagesCount, error: myPackagesError } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true });

    if (myPackagesError) {
      console.error('❌ Error counting my_packages:', myPackagesError);
    } else {
      console.log('📋 my_packages table:');
      console.log(`   Total count: ${myPackagesCount || 0}`);
    }

    // Get sample my_packages
    const { data: sampleMyPackages, error: sampleError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(3);

    if (!sampleError && sampleMyPackages && sampleMyPackages.length > 0) {
      console.log('\n   Sample my_package:');
      console.log(JSON.stringify(sampleMyPackages[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error checking my_packages table:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check if we need to sync packages
  const { count } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true });

  if (!count || count === 0) {
    console.log('⚠️  The packages table is empty!');
    console.log('💡 You need to sync packages from the Roamify API.');
    console.log('💡 Run the sync endpoint: POST /api/admin/packages/sync');
    console.log('💡 Or run: node sync_roamify_packages.js');
  }
}

checkDatabase().then(() => {
  console.log('\n✅ Database check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 