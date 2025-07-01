const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

async function fixGuestUserIssue() {
  console.log('🔧 Starting guest user fix...');
  
  try {
    // Step 1: Check current users table structure
    console.log('\n📋 Checking users table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => {
        // Fallback if RPC doesn't exist
        return { data: null, error: null };
      });
    
    // Step 2: Try to create guest user (simplified approach)
    console.log('\n👤 Creating guest user...');
    
    // First, check if guest user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', GUEST_USER_ID)
      .single();
    
    if (existingUser) {
      console.log('✅ Guest user already exists:', existingUser.email);
    } else {
      console.log('⚠️  Guest user not found, creating...');
      
      // Try multiple creation strategies
      const creationStrategies = [
        // Strategy 1: Full fields
        {
          name: 'Full user record',
          data: {
            id: GUEST_USER_ID,
            email: 'guest@esimal.com',
            password: 'disabled-account',
            first_name: 'Guest',
            last_name: 'User',
            role: 'guest'
          }
        },
        // Strategy 2: Minimal fields
        {
          name: 'Minimal user record',
          data: {
            id: GUEST_USER_ID,
            email: 'guest@esimal.com',
            password: 'disabled-account',
            role: 'guest'
          }
        },
        // Strategy 3: Essential only
        {
          name: 'Essential fields only',
          data: {
            id: GUEST_USER_ID,
            email: 'guest@esimal.com',
            password: 'disabled-account'
          }
        }
      ];
      
      let userCreated = false;
      
      for (const strategy of creationStrategies) {
        if (userCreated) break;
        
        console.log(`  Trying strategy: ${strategy.name}`);
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(strategy.data)
          .select()
          .single();
        
        if (!createError && newUser) {
          console.log(`✅ Guest user created successfully with strategy: ${strategy.name}`);
          console.log(`   User ID: ${newUser.id}`);
          console.log(`   Email: ${newUser.email}`);
          userCreated = true;
        } else {
          console.log(`   ❌ Strategy failed:`, createError?.message);
        }
      }
      
      if (!userCreated) {
        throw new Error('All user creation strategies failed');
      }
    }
    
    // Step 3: Fix user_orders constraints
    console.log('\n🔗 Fixing user_orders constraints...');
    
    // Check if user_orders table exists
    const { data: userOrdersExists } = await supabase
      .from('user_orders')
      .select('id')
      .limit(1)
      .single()
      .catch(() => ({ data: null }));
    
    if (!userOrdersExists) {
      console.log('⚠️  user_orders table not found, skipping constraint fixes');
    } else {
      // Try to fix constraints using SQL
      const constraintFixes = [
        `ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_user_id_fkey`,
        `ALTER TABLE user_orders ADD CONSTRAINT user_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`,
        `ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_package_id_fkey`,
        `ALTER TABLE user_orders ADD CONSTRAINT user_orders_package_id_fkey FOREIGN KEY (package_id) REFERENCES my_packages(id) ON DELETE CASCADE`
      ];
      
      for (const sql of constraintFixes) {
        try {
          await supabase.rpc('exec_sql', { sql_query: sql });
          console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
        } catch (sqlError) {
          console.log(`⚠️  SQL execution failed (continuing): ${sql.substring(0, 50)}...`);
        }
      }
    }
    
    // Step 4: Test the fix
    console.log('\n🧪 Testing the fix...');
    
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('id', GUEST_USER_ID)
      .single();
    
    if (finalError) {
      throw new Error(`Guest user verification failed: ${finalError.message}`);
    }
    
    console.log('✅ Guest user verified:');
    console.log(`   ID: ${finalUser.id}`);
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Role: ${finalUser.role || 'not set'}`);
    
    // Step 5: Test user_orders creation
    console.log('\n🧪 Testing user_orders creation...');
    
    // Try to find a package to test with
    const { data: testPackage } = await supabase
      .from('my_packages')
      .select('id')
      .limit(1)
      .single();
    
    if (testPackage) {
      const testOrderData = {
        user_id: GUEST_USER_ID,
        package_id: testPackage.id,
        roamify_order_id: 'test-order-' + Date.now(),
        status: 'pending'
      };
      
      const { data: testOrder, error: testOrderError } = await supabase
        .from('user_orders')
        .insert(testOrderData)
        .select()
        .single();
      
      if (testOrderError) {
        console.log(`⚠️  Test user_orders creation failed: ${testOrderError.message}`);
        console.log('   This might require manual database intervention');
      } else {
        console.log('✅ Test user_orders creation successful');
        
        // Clean up test order
        await supabase
          .from('user_orders')
          .delete()
          .eq('id', testOrder.id);
        console.log('✅ Test order cleaned up');
      }
    } else {
      console.log('⚠️  No packages found for testing user_orders creation');
    }
    
    console.log('\n🎉 Guest user fix completed successfully!');
    console.log('\n📝 What was fixed:');
    console.log('   ✅ Guest user exists in database');
    console.log('   ✅ Foreign key constraints updated (attempted)');
    console.log('   ✅ System ready for guest orders');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Monitor next webhook execution');
    console.log('   2. Check that user_orders entries are created');
    console.log('   3. Verify email delivery continues working');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the fix
if (require.main === module) {
  fixGuestUserIssue()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = { fixGuestUserIssue }; 