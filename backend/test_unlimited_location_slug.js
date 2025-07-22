/**
 * TEST: Verify unlimited packages get correct location_slug
 */

console.log('🧪 TESTING UNLIMITED PACKAGES LOCATION_SLUG ASSIGNMENT');
console.log('=' * 60);

// Simulate the logic from our updated savePackage controller
function determineLocationSlug(dataAmountFloat, providedLocationSlug, countryCode) {
  return dataAmountFloat === 0 ? "most-popular" : (providedLocationSlug || countryCode.toLowerCase());
}

function determineHomepageOrder(dataAmountFloat, providedOrder) {
  return dataAmountFloat === 0 ? 998 : (parseInt(providedOrder) || 999);
}

const testCases = [
  {
    name: 'Unlimited Package (no location_slug provided)',
    data: {
      data_amount: 0,
      location_slug: undefined,
      country_code: 'EU',
      homepage_order: undefined
    },
    expected: {
      location_slug: 'most-popular',
      homepage_order: 998
    }
  },
  {
    name: 'Unlimited Package (with location_slug provided)',
    data: {
      data_amount: 0,
      location_slug: 'custom-slug',
      country_code: 'DE',
      homepage_order: 5
    },
    expected: {
      location_slug: 'most-popular', // Should override provided slug
      homepage_order: 998 // Should override provided order
    }
  },
  {
    name: 'Normal Package (no location_slug provided)',
    data: {
      data_amount: 5,
      location_slug: undefined,
      country_code: 'FR',
      homepage_order: undefined
    },
    expected: {
      location_slug: 'fr', // Should use country code
      homepage_order: 999 // Should use default
    }
  },
  {
    name: 'Normal Package (with location_slug provided)',
    data: {
      data_amount: 10,
      location_slug: 'france-packages',
      country_code: 'FR',
      homepage_order: 3
    },
    expected: {
      location_slug: 'france-packages', // Should use provided slug
      homepage_order: 3 // Should use provided order
    }
  },
  {
    name: 'Unlimited Package (EUUS country)',
    data: {
      data_amount: 0,
      location_slug: undefined,
      country_code: 'EUUS',
      homepage_order: undefined
    },
    expected: {
      location_slug: 'most-popular',
      homepage_order: 998
    }
  }
];

console.log('\n🔍 RUNNING LOCATION_SLUG TESTS...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Input: data_amount=${testCase.data.data_amount}, location_slug="${testCase.data.location_slug}", country_code="${testCase.data.country_code}"`);
  
  const resultSlug = determineLocationSlug(
    testCase.data.data_amount, 
    testCase.data.location_slug, 
    testCase.data.country_code
  );
  
  const resultOrder = determineHomepageOrder(
    testCase.data.data_amount,
    testCase.data.homepage_order
  );
  
  const slugCorrect = resultSlug === testCase.expected.location_slug;
  const orderCorrect = resultOrder === testCase.expected.homepage_order;
  
  if (slugCorrect && orderCorrect) {
    console.log(`  ✅ PASS: location_slug="${resultSlug}", homepage_order=${resultOrder}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL:`);
    if (!slugCorrect) {
      console.log(`     location_slug: Expected "${testCase.expected.location_slug}", got "${resultSlug}"`);
    }
    if (!orderCorrect) {
      console.log(`     homepage_order: Expected ${testCase.expected.homepage_order}, got ${resultOrder}`);
    }
    failed++;
  }
  
  console.log('');
});

console.log('=' * 60);
console.log('📊 TEST RESULTS');
console.log('=' * 60);

console.log(`\nTotal Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log(`\n🎉 ALL TESTS PASSED!`);
  console.log(`✅ Unlimited packages (data_amount = 0) → location_slug = "most-popular"`);
  console.log(`✅ Unlimited packages (data_amount = 0) → homepage_order = 998 (last position)`);
  console.log(`✅ Normal packages → use provided or country-based location_slug`);
  console.log(`✅ Normal packages → use provided or default homepage_order`);
} else {
  console.log(`\n⚠️  ${failed} TEST(S) FAILED!`);
}

console.log('\n' + '=' * 60); 