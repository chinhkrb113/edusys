const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Mock token - in real scenario this would come from login
const mockToken = 'mock-jwt-token-for-testing';

async function testStartPractice() {
  console.log('🧪 Testing Assignment Start Practice API\n');

  try {
    // First, try to get an assignment ID (no auth for testing)
    console.log('1. Getting assignments list...');
    const assignmentsResponse = await axios.get(`${BASE_URL}/api/v1/assignments`);

    if (assignmentsResponse.data.data && assignmentsResponse.data.data.length > 0) {
      const assignmentId = assignmentsResponse.data.data[0].id;
      console.log(`✅ Found assignment ID: ${assignmentId}`);

      // Now test the start-practice endpoint (no auth for testing)
      console.log('2. Testing start-practice endpoint...');
      const startPracticeResponse = await axios.post(
        `${BASE_URL}/api/v1/assignments/${assignmentId}/start-practice`,
        {}
      );

      console.log('✅ Start practice successful!');
      console.log('Response:', JSON.stringify(startPracticeResponse.data, null, 2));

      return true;
    } else {
      console.log('❌ No assignments found to test with');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    return false;
  }
}

// Run the test
testStartPractice().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Start Practice API Test PASSED');
  } else {
    console.log('⚠️  Start Practice API Test FAILED');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});