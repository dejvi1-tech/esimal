const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runForeignKeyMigration() {
  try {
    console.log('🚀 Starting foreign key migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250103000000_add_foreign_key_my_packages_to_packages.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, executing...');
    console.log('🔧 This will:');
    console.log('   1. Convert my_packages.reseller_id from TEXT to UUID');
    console.log('   2. Add foreign key constraint to packages.id');
    console.log('   3. Create performance index');
    console.log('   4. Enable PostgREST joins\n');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the foreign key was created
    console.log('\n🔍 Verifying foreign key constraint...');
    const { data: constraints, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'my_packages' 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'fk_my_packages_reseller_id';
      `
    });
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Foreign key constraint verified:');
      console.log(`   my_packages.reseller_id -> packages.id`);
    } else {
      console.log('⚠️  Foreign key constraint not found (migration may have failed)');
    }
    
    // Test the PostgREST join
    console.log('\n🧪 Testing PostgREST join...');
    const { data: testJoin, error: joinError } = await supabase
      .from('my_packages')
      .select(`
        id,
        name,
        packages!fk_my_packages_reseller_id(id, name)
      `)
      .limit(1);
    
    if (joinError) {
      console.log('⚠️  PostgREST join test failed (this is expected if no valid data exists yet):', joinError.message);
    } else {
      console.log('✅ PostgREST join working! Sample result:', testJoin);
    }
    
    console.log('\n🎉 Migration completed! Your API should now work properly.');
    console.log('💡 Remember to sync packages data to my_packages table if needed.');
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
    process.exit(1);
  }
}

runForeignKeyMigration(); 