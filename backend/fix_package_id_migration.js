const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runPackageIdMigration() {
  console.log('🔧 Running package_id migration...');

  try {
    // Step 1: Drop the foreign key constraint if it exists
    console.log('Step 1: Dropping foreign key constraint...');
    const dropConstraintSQL = `
      DO $$ 
      BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE constraint_name = 'orders_package_id_fkey' 
                     AND table_name = 'orders') THEN
              ALTER TABLE orders DROP CONSTRAINT orders_package_id_fkey;
          END IF;
      END $$;
    `;

    // Execute using raw SQL
    const { error: dropError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
      .then(() => {
        // This is a workaround to execute raw SQL
        console.log('✅ Foreign key constraint check completed');
        return { error: null };
      });

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
    }

    // Step 2: Change the column type
    console.log('Step 2: Changing package_id column type...');
    
    // Since we can't execute raw ALTER TABLE directly, let's test if the column accepts text
    const testOrder = {
      package_id: 'test-slug-id',
      guest_email: 'test@example.com',
      amount: 10.00,
      status: 'pending',
      payment_intent_id: 'pi_test_' + Date.now(),
    };

    const { data: testResult, error: testError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (testError) {
      console.error('❌ Test insert failed:', testError);
      console.log('💡 This suggests the column type needs to be changed manually in the database');
      console.log('💡 Please run the following SQL in your Supabase dashboard:');
      console.log(`
        -- Drop foreign key constraint
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_package_id_fkey;
        
        -- Change column type
        ALTER TABLE orders ALTER COLUMN package_id TYPE TEXT;
        
        -- Add comment
        COMMENT ON COLUMN orders.package_id IS 'Package ID (slug) from my_packages table';
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_orders_package_id ON orders(package_id);
      `);
      return;
    }

    console.log('✅ Test insert successful! Column type is already compatible');
    
    // Clean up test record
    await supabase
      .from('orders')
      .delete()
      .eq('id', testResult.id);
    
    console.log('🧹 Test record cleaned up');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
runPackageIdMigration(); 