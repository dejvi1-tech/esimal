const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPackagesTable() {
  try {
    console.log('🔍 Checking packages table...');
    
    // Check if packages table exists and has data
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying packages table:', error);
      return;
    }

    console.log(`📦 Packages table has ${packages?.length || 0} records`);
    
    if (packages && packages.length > 0) {
      console.log('📋 Sample package:');
      console.log(JSON.stringify(packages[0], null, 2));
    } else {
      console.log('⚠️  Packages table is empty!');
    }

    // Check my_packages table too
    console.log('\n🔍 Checking my_packages table...');
    const { data: myPackages, error: myError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(5);

    if (myError) {
      console.error('❌ Error querying my_packages table:', myError);
      return;
    }

    console.log(`📦 my_packages table has ${myPackages?.length || 0} records`);
    
    if (myPackages && myPackages.length > 0) {
      console.log('📋 Sample my_package:');
      console.log(JSON.stringify(myPackages[0], null, 2));
    }

    // Check table structure
    console.log('\n🔍 Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('packages')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('❌ Error checking structure:', structureError);
    } else {
      console.log('✅ packages table structure is accessible');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPackagesTable(); 