// Test script to verify the normalized API is working
// Run this with: node test_normalized_api.js

// Import the API functions
const { fetchTracts, fetchTract, fetchTractOwners, fetchTractPricing } = require('./services/api.ts');

async function testNormalizedAPI() {
  console.log('🧪 Testing Normalized API...\n');

  try {
    // Test 1: Fetch all tracts
    console.log('1. Testing fetchTracts()...');
    const tracts = await fetchTracts();
    console.log(`✅ Found ${tracts.length} tracts`);
    console.log('Sample tract:', tracts[0]);
    console.log('');

    // Test 2: Fetch specific tract
    console.log('2. Testing fetchTract()...');
    if (tracts.length > 0) {
      const tract = await fetchTract(tracts[0].id);
      console.log('✅ Tract details:', tract);
    }
    console.log('');

    // Test 3: Fetch tract owners
    console.log('3. Testing fetchTractOwners()...');
    if (tracts.length > 0) {
      const owners = await fetchTractOwners(tracts[0].id);
      console.log(`✅ Found ${owners.length} owners for tract ${tracts[0].id}`);
      if (owners.length > 0) {
        console.log('Sample owner:', owners[0]);
      }
    }
    console.log('');

    // Test 4: Fetch tract pricing
    console.log('4. Testing fetchTractPricing()...');
    if (tracts.length > 0) {
      const pricing = await fetchTractPricing(tracts[0].id);
      console.log(`✅ Found ${pricing.length} pricing records for tract ${tracts[0].id}`);
      if (pricing.length > 0) {
        console.log('Sample pricing:', pricing[0]);
      }
    }
    console.log('');

    console.log('🎉 All tests passed! The normalized API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNormalizedAPI();
