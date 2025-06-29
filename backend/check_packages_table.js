const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackagesTable() {
  try {
    console.log('Checking packages table...');
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .limit(10);
    if (error) {
      console.error('Error:', error);
      return;
    }
    if (!data || data.length === 0) {
      console.log('No packages found!');
      return;
    }
    console.log(`Found ${data.length} packages. Sample:`);
    data.forEach((pkg, i) => {
      console.log(`\n${i + 1}.`);
      console.log('  packageId:', pkg.packageId);
      console.log('  slug:', pkg.slug);
      console.log('  reseller_id:', pkg.reseller_id);
      console.log('  All fields:', JSON.stringify(pkg, null, 2));
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

checkPackagesTable(); 