#!/usr/bin/env node

// Simple script to create guest user in production database
// Usage: SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node create_guest_user_simple.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL=https://divckbitgqmlvlzzcjbk.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  console.error('');
  console.error('You can find these in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

async function createGuestUser() {
  console.log('🔧 Creating guest user for eSIM system...');
  
  try {
    // Check if guest user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', GUEST_USER_ID)
      .single();
    
    if (existingUser) {
      console.log('✅ Guest user already exists:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      return true;
    }
    
    // Create guest user
    console.log('👤 Creating new guest user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: GUEST_USER_ID,
        email: 'guest@esimal.com',
        password: 'disabled-account',
        role: 'user'  // Use 'user' since 'guest' is not in enum
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create guest user:', createError.message);
      return false;
    }
    
    console.log('✅ Guest user created successfully:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    
    console.log('\n🎉 Success! Your eSIM system is now ready for guest orders.');
    console.log('   Next webhook execution should work correctly.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    return false;
  }
}

createGuestUser()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  }); 