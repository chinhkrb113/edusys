const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test authentication flow
let accessToken = null;

async function testStartPractice() {
  console.log('🧪 Testing Assignment Start Practice API\n');

  try {
    // First, login to get access token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    accessToken = loginResponse.data.access_token;
    console.log('✅ Login successful, got access token');

    const headers = { Authorization: `Bearer ${accessToken}` };

    // Get assignments list
    console.log('2. Getting assignments list...');
    const assignmentsResponse = await axios.get(`${BASE_URL}/api/v1/assignments`, { headers });

    if (assignmentsResponse.data.data && assignmentsResponse.data.data.length > 0) {
      const assignmentId = assignmentsResponse.data.data[0].id;
      console.log(`✅ Found assignment ID: ${assignmentId}`);

      // Now test the start-practice endpoint
      console.log('2. Testing start-practice endpoint...');
      const startPracticeResponse = await axios.post(
        `${BASE_URL}/api/v1/assignments/${assignmentId}/start-practice`,
        {},
        headers ? { headers } : {}
      );

      console.log('✅ Start practice successful!');
      console.log('Response:', JSON.stringify(startPracticeResponse.data, null, 2));

      // Test logout
      console.log('4. Testing logout...');
      const logoutResponse = await axios.post(`${BASE_URL}/api/v1/auth/logout`, {}, { headers });
      console.log('✅ Logout successful!');

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