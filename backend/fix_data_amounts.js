const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || "https://divckbitgqmlvlzzcjbk.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('This script should be run on the cloud platform where environment variables are configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDataAmounts() {
  try {
    console.log('🔧 Fixing massive data amount bug...\n');

    // 1. Get all packages with massive data amounts (> 100GB likely wrong)
    const { data: problematicPackages, error: fetchError } = await supabase
      .from('my_packages')
      .select('*')
      .gt('data_amount', 100);

    if (fetchError) {
      console.error('Error fetching packages:', fetchError);
      return;
    }

    console.log(`Found ${problematicPackages.length} packages with massive data amounts:`);

    let fixedCount = 0;

    for (const pkg of problematicPackages) {
      console.log(`\n📦 ${pkg.name} (${pkg.country_name})`);
      console.log(`   Current: ${pkg.data_amount}GB`);
      
      // Determine the correct data amount based on the package name
      let correctDataAmount = pkg.data_amount;
      
      // Extract GB from package name 
      const nameMatch = pkg.name.match(/(\d+)\s*GB/i);
      if (nameMatch) {
        correctDataAmount = parseInt(nameMatch[1]);
        console.log(`   Should be: ${correctDataAmount}GB (from name)`);
      } 
      // If data_amount looks like it was double-converted (1024, 3072, 5120, etc.)
      else if (pkg.data_amount === 1024) {
        correctDataAmount = 1;
        console.log(`   Should be: 1GB (1024 = double-converted 1GB)`);
      }
      else if (pkg.data_amount === 3072) {
        correctDataAmount = 3;
        console.log(`   Should be: 3GB (3072 = double-converted 3GB)`);
      }
      else if (pkg.data_amount === 5120) {
        correctDataAmount = 5;
        console.log(`   Should be: 5GB (5120 = double-converted 5GB)`);
      }
      else if (pkg.data_amount === 10240) {
        correctDataAmount = 10;
        console.log(`   Should be: 10GB (10240 = double-converted 10GB)`);
      }
      else if (pkg.data_amount === 20480) {
        correctDataAmount = 20;
        console.log(`   Should be: 20GB (20480 = double-converted 20GB)`);
      }
      else if (pkg.data_amount === 30720) {
        correctDataAmount = 30;
        console.log(`   Should be: 30GB (30720 = double-converted 30GB)`);
      }
      else if (pkg.data_amount === 51200) {
        correctDataAmount = 50;
        console.log(`   Should be: 50GB (51200 = double-converted 50GB)`);
      }
      else {
        console.log(`   Skipping: Can't determine correct amount`);
        continue;
      }

      // Update the package
      const { error: updateError } = await supabase
        .from('my_packages')
        .update({
          data_amount: correctDataAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed: ${pkg.data_amount}GB → ${correctDataAmount}GB`);
        fixedCount++;
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} packages with incorrect data amounts!`);

  } catch (error) {
    console.error('❌ Error fixing data amounts:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  fixDataAmounts();
}

module.exports = { fixDataAmounts }; 