const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersSchema() {
  try {
    console.log('Checking orders table schema...');
    
    // Try to get a single row to see what columns exist
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing orders table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Available columns in orders table:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('Orders table is empty, checking schema...');
      
      // Try to get schema information
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: 'orders' });
      
      if (schemaError) {
        console.error('Error getting schema:', schemaError);
      } else {
        console.log('Schema columns:', schemaData);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkOrdersSchema(); 