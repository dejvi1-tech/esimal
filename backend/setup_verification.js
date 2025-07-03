#!/usr/bin/env node

/**
 * Package Integrity Verification Setup
 * 
 * This script helps you set up the package integrity verification system
 * by checking for required environment variables and dependencies.
 */

const fs = require('fs');
const path = require('path');

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const optionalVars = [
    'ROAMIFY_API_KEY',
    'NODE_ENV',
    'PORT'
  ];

  let allGood = true;
  const missing = [];
  const present = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push({ name: varName, required: true, value: process.env[varName] });
    } else {
      missing.push({ name: varName, required: true });
      allGood = false;
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      present.push({ name: varName, required: false, value: process.env[varName] });
    } else {
      missing.push({ name: varName, required: false });
    }
  });

  // Report results
  if (present.length > 0) {
    console.log('✅ Found environment variables:');
    present.forEach(env => {
      const value = env.name.includes('KEY') || env.name.includes('SECRET') 
        ? `${env.value.substring(0, 10)}...` 
        : env.value;
      console.log(`   ${env.required ? '🔴' : '🟡'} ${env.name} = ${value}`);
    });
    console.log('');
  }

  if (missing.length > 0) {
    console.log('❌ Missing environment variables:');
    missing.forEach(env => {
      console.log(`   ${env.required ? '🔴 REQUIRED' : '🟡 OPTIONAL'} ${env.name}`);
    });
    console.log('');
  }

  return { allGood, missing: missing.filter(m => m.required), optional: missing.filter(m => !m.required) };
}

function checkDotEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env file');
    require('dotenv').config({ path: envPath });
    return true;
  } else {
    console.log('⚠️  No .env file found');
    
    // Create a sample .env file
    const sampleEnv = `# Environment Variables for eSIM Management System
# Fill in your actual values below

# Supabase Database Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Roamify API Configuration (OPTIONAL for verification)
ROAMIFY_API_KEY=your-roamify-api-key-here

# Application Configuration (OPTIONAL)
NODE_ENV=development
PORT=3001
`;

    try {
      fs.writeFileSync(envPath, sampleEnv);
      console.log('📝 Created sample .env file - please edit it with your values');
    } catch (error) {
      console.log('⚠️  Could not create .env file. Please create one manually.');
    }

    return false;
  }
}

function checkDependencies() {
  console.log('🔍 Checking dependencies...\n');

  const requiredPackages = [
    '@supabase/supabase-js',
    'dotenv'
  ];

  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ No package.json found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  let allInstalled = true;

  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg} - v${dependencies[pkg]}`);
    } else {
      console.log(`❌ ${pkg} - NOT INSTALLED`);
      allInstalled = false;
    }
  });

  console.log('');
  return allInstalled;
}

function showNextSteps(envCheck) {
  console.log('📋 NEXT STEPS:\n');

  if (envCheck.missing.length > 0) {
    console.log('1. 🔑 SET REQUIRED ENVIRONMENT VARIABLES:');
    envCheck.missing.forEach(env => {
      console.log(`   - ${env.name}`);
    });
    console.log('');

    console.log('   How to get these values:');
    console.log('   - SUPABASE_URL: Go to Supabase project → Settings → API');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY: Go to Supabase project → Settings → API → service_role key');
    console.log('');
  }

  if (envCheck.optional.length > 0) {
    console.log('2. 🟡 OPTIONAL VARIABLES (for full functionality):');
    envCheck.optional.forEach(env => {
      console.log(`   - ${env.name}`);
    });
    console.log('');
  }

  console.log('3. 🚀 RUN VERIFICATION:');
  console.log('   node verify_package_integrity.js');
  console.log('');

  console.log('4. 🔧 FIX ISSUES (if any found):');
  console.log('   node fix_package_integrity.js --dry-run');
  console.log('   node fix_package_integrity.js --remove-orphaned');
  console.log('');
}

function main() {
  console.log('🔧 Package Integrity Verification Setup\n');

  // Check for .env file and load it
  console.log('1. Environment File Check:');
  checkDotEnvFile();
  console.log('');

  // Check dependencies
  console.log('2. Dependencies Check:');
  const depsOk = checkDependencies();
  console.log('');

  // Check environment variables
  console.log('3. Environment Variables Check:');
  const envCheck = checkEnvironmentVariables();
  console.log('');

  // Show next steps
  showNextSteps(envCheck);

  // Final status
  if (envCheck.allGood && depsOk) {
    console.log('🎉 SETUP COMPLETE! You can now run the verification scripts.');
    process.exit(0);
  } else {
    console.log('⚠️  SETUP INCOMPLETE - Please complete the steps above first.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkDotEnvFile,
  checkDependencies
}; 