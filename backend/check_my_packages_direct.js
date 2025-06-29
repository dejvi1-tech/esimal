const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the deployed backend
const supabaseUrl = 'https://divckbitgqmlvlzzcjbk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmNrYml0Z3FtbHZsenpjamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5ODYyODYsImV4cCI6MjA2NDU2MjI4Nn0.rsef9b_QohgdEMjO7rFiDcTwkU4BAqSJbiwLuhvxvDM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMyPackages() {
  try {
    console.log('Checking my_packages table...');
    
    // First, let's see what columns exist
    const { data: sample, error: sampleError } = await supabase
      .from('my_packages')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Table columns:', Object.keys(sample[0]));
      console.log('Sample row:', JSON.stringify(sample[0], null, 2));
    }
    
    // Now search for Europe & US package using correct column names
    console.log('\nSearching for Europe & US package...');
    const { data: europeUs, error: europeError } = await supabase
      .from('my_packages')
      .select('*')
      .or('name.ilike.%europe%,name.ilike.%us%,reseller_id.ilike.%europe%,reseller_id.ilike.%us%')
      .limit(10);
    
    if (europeError) {
      console.error('Error searching for Europe & US:', europeError);
      return;
    }
    
    console.log(`Found ${europeUs.length} packages that might be Europe & US:`);
    europeUs.forEach((pkg, index) => {
      console.log(`\n${index + 1}. ${pkg.name || 'No name'}`);
      console.log('   Reseller ID:', pkg.reseller_id);
      console.log('   ID:', pkg.id);
      console.log('   Country:', pkg.country_name);
      console.log('   All fields:', JSON.stringify(pkg, null, 2));
    });
    
    // Check if we have reseller_id or packageId fields
    if (europeUs.length > 0) {
      const firstPkg = europeUs[0];
      console.log('\nChecking for reseller_id or packageId fields...');
      console.log('Has reseller_id:', 'reseller_id' in firstPkg);
      console.log('Has packageId:', 'packageId' in firstPkg);
      console.log('Has roamify_package_id:', 'roamify_package_id' in firstPkg);
    }
    
    // Also check the packages table
    console.log('\nChecking packages table...');
    const { data: packagesSample, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .limit(5);
    
    if (packagesError) {
      console.error('Error getting packages sample:', packagesError);
    } else {
      console.log(`Packages table has ${packagesSample.length} rows`);
      if (packagesSample.length > 0) {
        console.log('Packages table columns:', Object.keys(packagesSample[0]));
        console.log('Sample package:', JSON.stringify(packagesSample[0], null, 2));
      }
    }
    
    // Search for the specific Europe & US package by reseller_id
    console.log('\nSearching for specific Europe & US package...');
    const { data: specificPackage, error: specificError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('reseller_id', 'esim-europe-us-30days-3gb-all')
      .single();
    
    if (specificError) {
      console.error('Error finding specific package:', specificError);
    } else {
      console.log('Found Europe & US package:');
      console.log(JSON.stringify(specificPackage, null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkMyPackages(); 