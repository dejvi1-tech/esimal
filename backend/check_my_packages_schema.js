const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMyPackagesSchema() {
  console.log('🔍 Checking my_packages table schema...\n');

  try {
    // Get a sample record to see all columns
    const { data: sample, error: sampleError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error fetching sample record:', sampleError);
      return;
    }

    if (!sample || sample.length === 0) {
      console.log('⚠️  No records found in my_packages table');
      return;
    }

    const columns = Object.keys(sample[0]);
    console.log('📋 Current columns in my_packages table:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col}`);
    });

    // Check specifically for slug column
    const hasSlug = columns.includes('slug');
    console.log(`\n🔍 Slug column exists: ${hasSlug ? '✅ YES' : '❌ NO'}`);

    // Check for features column and its structure
    const hasFeatures = columns.includes('features');
    console.log(`🔍 Features column exists: ${hasFeatures ? '✅ YES' : '❌ NO'}`);

    if (hasFeatures && sample[0].features) {
      console.log('\n📦 Sample features structure:');
      console.log(JSON.stringify(sample[0].features, null, 2));
    }

    // Check for packageId in features
    if (hasFeatures && sample[0].features && sample[0].features.packageId) {
      console.log(`\n🎯 Package ID from features: ${sample[0].features.packageId}`);
    }

    console.log('\n✅ Schema check completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMyPackagesSchema(); 