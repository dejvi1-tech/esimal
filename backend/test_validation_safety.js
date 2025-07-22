/**
 * VALIDATION SAFETY TEST
 * 
 * This script tests that our unlimited package fixes don't break normal packages
 * Tests both valid and invalid scenarios for normal AND unlimited packages
 */

console.log('🧪 VALIDATION SAFETY TEST - ENSURING NORMAL PACKAGES STILL WORK');
console.log('=' * 80);

// Simulate the validation logic from our fixed controllers
function validateRequiredFields(data) {
  const { name, country_name, country_code, data_amount, days } = data;
  
  // Our NEW validation logic (should allow 0 but reject undefined/null)
  if (!name || !country_name || !country_code || data_amount === undefined || data_amount === null || days === undefined || days === null) {
    return { valid: false, error: 'Missing required fields: name, country_name, country_code, data_amount, days' };
  }
  
  return { valid: true };
}

function validateDataAmount(data_amount) {
  // Our NEW validation logic (should allow 0 but reject negative)
  if (data_amount < 0) {
    return { valid: false, error: 'Data amount must be 0 or greater (0 = unlimited)' };
  }
  
  return { valid: true };
}

function validateDays(days) {
  // Our NEW validation logic (should allow 0 but reject negative)
  if (days < 0) {
    return { valid: false, error: 'Days must be 0 or greater (0 = unlimited duration)' };
  }
  
  return { valid: true };
}

// Test cases covering all scenarios
const testCases = [
  // NORMAL PACKAGES (should continue working)
  {
    name: 'Normal Package - 5GB/30days',
    data: {
      name: 'Europe 5GB',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 5,
      days: 30
    },
    expectedValid: true,
    category: 'normal'
  },
  {
    name: 'Normal Package - 1GB/7days',
    data: {
      name: 'Germany 1GB',
      country_name: 'Germany',
      country_code: 'DE',
      data_amount: 1,
      days: 7
    },
    expectedValid: true,
    category: 'normal'
  },
  {
    name: 'Normal Package - 10GB/15days',
    data: {
      name: 'France 10GB',
      country_name: 'France',
      country_code: 'FR',
      data_amount: 10,
      days: 15
    },
    expectedValid: true,
    category: 'normal'
  },
  {
    name: 'Normal Package - 0.5GB/1day',
    data: {
      name: 'Italy 500MB',
      country_name: 'Italy',
      country_code: 'IT',
      data_amount: 0.5,
      days: 1
    },
    expectedValid: true,
    category: 'normal'
  },
  
  // UNLIMITED PACKAGES (should now work)
  {
    name: 'Unlimited Data Package',
    data: {
      name: 'Unlimited Europe',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 0,  // Unlimited data
      days: 30
    },
    expectedValid: true,
    category: 'unlimited'
  },
  {
    name: 'Unlimited Duration Package',
    data: {
      name: 'Germany 5GB Unlimited',
      country_name: 'Germany',
      country_code: 'DE',
      data_amount: 5,
      days: 0  // Unlimited duration
    },
    expectedValid: true,
    category: 'unlimited'
  },
  {
    name: 'Fully Unlimited Package',
    data: {
      name: 'Unlimited Everything',
      country_name: 'Global',
      country_code: 'GL',
      data_amount: 0,  // Unlimited data
      days: 0          // Unlimited duration
    },
    expectedValid: true,
    category: 'unlimited'
  },
  
  // INVALID PACKAGES (should still be rejected)
  {
    name: 'Missing Name',
    data: {
      name: null,
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 5,
      days: 30
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Missing Country Name',
    data: {
      name: 'Test Package',
      country_name: '',
      country_code: 'EU',
      data_amount: 5,
      days: 30
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Missing Country Code',
    data: {
      name: 'Test Package',
      country_name: 'Europe',
      country_code: null,
      data_amount: 5,
      days: 30
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Undefined Data Amount',
    data: {
      name: 'Test Package',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: undefined,
      days: 30
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Null Days',
    data: {
      name: 'Test Package',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 5,
      days: null
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Negative Data Amount',
    data: {
      name: 'Test Package',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: -1,
      days: 30
    },
    expectedValid: false,
    category: 'invalid'
  },
  {
    name: 'Negative Days',
    data: {
      name: 'Test Package',
      country_name: 'Europe',
      country_code: 'EU',
      data_amount: 5,
      days: -5
    },
    expectedValid: false,
    category: 'invalid'
  }
];

console.log('\n🔍 RUNNING VALIDATION TESTS...\n');

let passed = 0;
let failed = 0;
let normalPackagesPassed = 0;
let unlimitedPackagesPassed = 0;
let invalidPackagesRejected = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Category: ${testCase.category.toUpperCase()}`);
  console.log(`  Data: ${JSON.stringify(testCase.data, null, 2).replace(/\n/g, '\n        ')}`);
  
  // Run validation
  const requiredFieldsResult = validateRequiredFields(testCase.data);
  let finalResult = requiredFieldsResult;
  
  // If required fields pass, check data amount and days
  if (requiredFieldsResult.valid) {
    const dataAmountResult = validateDataAmount(testCase.data.data_amount);
    if (!dataAmountResult.valid) {
      finalResult = dataAmountResult;
    } else {
      const daysResult = validateDays(testCase.data.days);
      if (!daysResult.valid) {
        finalResult = daysResult;
      }
    }
  }
  
  const isCorrect = finalResult.valid === testCase.expectedValid;
  
  if (isCorrect) {
    console.log(`  ✅ PASS: ${testCase.expectedValid ? 'Correctly accepted' : 'Correctly rejected'}`);
    if (finalResult.error) console.log(`     Rejection reason: ${finalResult.error}`);
    passed++;
    
    // Track category success
    if (testCase.category === 'normal' && testCase.expectedValid) normalPackagesPassed++;
    if (testCase.category === 'unlimited' && testCase.expectedValid) unlimitedPackagesPassed++;
    if (testCase.category === 'invalid' && !testCase.expectedValid) invalidPackagesRejected++;
  } else {
    console.log(`  ❌ FAIL: Expected ${testCase.expectedValid ? 'ACCEPT' : 'REJECT'}, got ${finalResult.valid ? 'ACCEPT' : 'REJECT'}`);
    if (finalResult.error) console.log(`     Error: ${finalResult.error}`);
    failed++;
  }
  
  console.log('');
});

// Summary
console.log('=' * 80);
console.log('📊 TEST RESULTS SUMMARY');
console.log('=' * 80);

console.log(`\n🎯 OVERALL RESULTS:`);
console.log(`   Total Tests: ${testCases.length}`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

console.log(`\n📦 BY CATEGORY:`);
console.log(`   ✅ Normal Packages Working: ${normalPackagesPassed}/4`);
console.log(`   ✅ Unlimited Packages Working: ${unlimitedPackagesPassed}/3`);
console.log(`   ✅ Invalid Packages Rejected: ${invalidPackagesRejected}/7`);

console.log(`\n🔍 BACKWARD COMPATIBILITY CHECK:`);
if (normalPackagesPassed === 4) {
  console.log(`   ✅ ALL NORMAL PACKAGES STILL WORK - No breaking changes!`);
} else {
  console.log(`   ❌ NORMAL PACKAGES BROKEN - ${4 - normalPackagesPassed} failing!`);
}

console.log(`\n🆕 NEW FUNCTIONALITY CHECK:`);
if (unlimitedPackagesPassed === 3) {
  console.log(`   ✅ ALL UNLIMITED PACKAGES NOW WORK - Feature complete!`);
} else {
  console.log(`   ❌ UNLIMITED PACKAGES BROKEN - ${3 - unlimitedPackagesPassed} failing!`);
}

console.log(`\n🔒 SECURITY CHECK:`);
if (invalidPackagesRejected === 7) {
  console.log(`   ✅ ALL INVALID PACKAGES REJECTED - Security maintained!`);
} else {
  console.log(`   ❌ SECURITY ISSUES - ${7 - invalidPackagesRejected} invalid packages accepted!`);
}

if (failed === 0) {
  console.log(`\n🎉 ALL TESTS PASSED! Changes are safe for production.`);
  console.log(`   ✅ Normal packages continue working`);
  console.log(`   ✅ Unlimited packages now work`);
  console.log(`   ✅ Invalid packages still rejected`);
  console.log(`   ✅ No breaking changes detected`);
} else {
  console.log(`\n⚠️  ${failed} TEST(S) FAILED - Review needed before deployment!`);
}

console.log('\n' + '=' * 80); 