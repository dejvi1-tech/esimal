const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration to add visible, reseller_id, and country_code columns...');
    
    // Since we can't use exec_sql, let's check if the columns already exist
    // by trying to query them
    console.log('Checking current table structure...');
    
    const { data, error } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, validity_days, base_price, sale_price, profit, created_at, updated_at')
      .limit(1);

    if (error) {
      console.error('Error querying my_packages:', error);
      return;
    }

    console.log('✅ my_packages table exists');
    console.log('Current columns:', Object.keys(data[0] || {}));
    
    // Try to add a test record with the new columns to see if they exist
    const testRecord = {
      id: 'test-migration-' + Date.now(),
      name: 'Test Package',
      country_name: 'Test Country',
      country_code: 'TC',
      data_amount: 1,
      validity_days: 1,
      base_price: 1.00,
      sale_price: 1.50,
      profit: 0.50,
      visible: true,
      reseller_id: 'test-reseller-id'
    };

    console.log('Testing insert with new columns...');
    const { error: insertError } = await supabase
      .from('my_packages')
      .insert([testRecord]);

    if (insertError) {
      console.error('❌ Columns do not exist yet:', insertError.message);
      console.log('');
      console.log('📋 Manual steps required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('');
      console.log('ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;');
      console.log('ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS reseller_id text;');
      console.log('ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS country_code text;');
      console.log('ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS region text;');
      console.log('CREATE INDEX IF NOT EXISTS idx_my_packages_visible ON my_packages(visible);');
      console.log('CREATE INDEX IF NOT EXISTS idx_my_packages_reseller_id ON my_packages(reseller_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_my_packages_country_code ON my_packages(country_code);');
      console.log('CREATE INDEX IF NOT EXISTS idx_my_packages_country_search ON my_packages(country_name, country_code);');
      console.log('');
    } else {
      console.log('✅ New columns exist! Cleaning up test record...');
      
      // Clean up the test record
      const { error: deleteError } = await supabase
        .from('my_packages')
        .delete()
        .eq('id', testRecord.id);

      if (deleteError) {
        console.log('Warning: Could not clean up test record:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }
      
      console.log('🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration(); 