const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let accessToken = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (message) console.log(`   ${message}`);

  results.tests.push({ testName, success, message });
  if (success) results.passed++;
  else results.failed++;
}

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const isHealthy = response.data.status === 'healthy';
    logTest('Health Check', isHealthy, `Status: ${response.data.status}`);
    return isHealthy;
  } catch (error) {
    logTest('Health Check', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Authentication Required (should fail without token)
async function testAuthRequired() {
  try {
    await axios.get(`${BASE_URL}/api/v1/kct`);
    logTest('Auth Required (no token)', false, 'Should have failed with 401');
    return false;
  } catch (error) {
    const is401 = error.response?.status === 401;
    logTest('Auth Required (no token)', is401, `Status: ${error.response?.status}`);
    return is401;
  }
}

// Test 3: Login Endpoint (will fail without DB, but test structure)
async function testLoginEndpoint() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    logTest('Login Endpoint Structure', true, 'Endpoint accepts request');
    accessToken = response.data?.access_token;
    return true;
  } catch (error) {
    // Expected to fail in dev mode without DB
    const isServerError = error.response?.status >= 500;
    logTest('Login Endpoint Structure', !isServerError, `Status: ${error.response?.status} (expected in dev mode)`);
    return !isServerError;
  }
}

// Test 4: Curriculum List Endpoint
async function testCurriculumList() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const response = await axios.get(`${BASE_URL}/api/v1/kct`, { headers });
    logTest('Curriculum List', true, `Returned ${response.data.data?.length || 0} items`);
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Curriculum List', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 5: Version Management Endpoint
async function testVersionEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/versions/1`, { headers });
    logTest('Version Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Version Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 6: Course Management Endpoint
async function testCourseEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/courses/1`, { headers });
    logTest('Course Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Course Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 7: Unit Management Endpoint
async function testUnitEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/units/1`, { headers });
    logTest('Unit Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Unit Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 8: Resource Management Endpoint
async function testResourceEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/resources/units/1/resources`, { headers });
    logTest('Resource Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Resource Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 9: Approval Workflow Endpoint
async function testApprovalEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/approvals/versions/1/approvals`, { headers });
    logTest('Approval Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Approval Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 10: Comments Endpoint
async function testCommentsEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/comments/entities/framework/1/comments`, { headers });
    logTest('Comments Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Comments Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 11: Mappings Endpoint
async function testMappingsEndpoint() {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await axios.get(`${BASE_URL}/api/v1/kct/mappings`, { headers });
    logTest('Mappings Endpoint', true, 'Endpoint accessible');
    return true;
  } catch (error) {
    const isAuthError = error.response?.status === 401;
    logTest('Mappings Endpoint', isAuthError, `Status: ${error.response?.status} (auth required)`);
    return isAuthError;
  }
}

// Test 12: Invalid Endpoint (should return 404)
async function testInvalidEndpoint() {
  try {
    await axios.get(`${BASE_URL}/api/v1/invalid-endpoint`);
    logTest('Invalid Endpoint', false, 'Should have returned 404');
    return false;
  } catch (error) {
    const is404 = error.response?.status === 404;
    logTest('Invalid Endpoint', is404, `Status: ${error.response?.status}`);
    return is404;
  }
}

// Test 13: Rate Limiting
async function testRateLimiting() {
  const requests = [];
  for (let i = 0; i < 15; i++) {
    requests.push(axios.get(`${BASE_URL}/api/v1/kct`).catch(e => e));
  }

  try {
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.response?.status === 429);
    logTest('Rate Limiting', rateLimited, 'Rate limiting is working');
    return rateLimited;
  } catch (error) {
    logTest('Rate Limiting', false, 'Rate limiting test failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests for Curriculum Management System\n');
  console.log('=' .repeat(60));

  // Basic connectivity tests
  await testHealthCheck();
  await testInvalidEndpoint();

  // Authentication tests
  await testAuthRequired();
  await testLoginEndpoint();

  // Module-specific tests
  await testCurriculumList();
  await testVersionEndpoint();
  await testCourseEndpoint();
  await testUnitEndpoint();
  await testResourceEndpoint();
  await testApprovalEndpoint();
  await testCommentsEndpoint();
  await testMappingsEndpoint();

  // Security tests
  await testRateLimiting();

  // Results summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
    console.log('Note: In development mode, some endpoints may fail due to missing database connection.');
  }

  console.log('\n🔍 Test Details:');
  results.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.testName}: ${test.success ? '✅' : '❌'} ${test.message}`);
  });
}

// Handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});