const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be provided in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMyPackagesTable() {
  try {
    console.log('Creating my_packages table...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS my_packages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          reseller_id text,
          country text,
          name text,
          data float,
          days int,
          base_price float,
          sale_price float,
          visible boolean DEFAULT true,
          region text
        );
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      console.log('\nPlease run this SQL manually in your Supabase dashboard:');
      console.log(`
        CREATE TABLE my_packages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          reseller_id text,
          country text,
          name text,
          data float,
          days int,
          base_price float,
          sale_price float,
          visible boolean DEFAULT true,
          region text
        );
      `);
    } else {
      console.log('✅ my_packages table created successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run this SQL manually in your Supabase dashboard:');
    console.log(`
      CREATE TABLE my_packages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id text,
        country text,
        name text,
        data float,
        days int,
        base_price float,
        sale_price float,
        visible boolean DEFAULT true,
        region text
      );
    `);
  }
}

createMyPackagesTable(); 