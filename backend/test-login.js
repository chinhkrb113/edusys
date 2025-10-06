const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogin() {
  console.log('🔐 Testing Login API...');

  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('📧 User:', response.data.user.email);
    console.log('🔑 Token:', response.data.access_token.substring(0, 20) + '...');
    console.log('🔄 Refresh Token:', response.data.refresh_token.substring(0, 20) + '...');

    return response.data.access_token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.status, error.response?.data?.error?.message);
    return null;
  }
}

async function testProtectedAPI(token) {
  console.log('\n🔒 Testing Protected API with token...');

  try {
    const response = await axios.get(`${BASE_URL}/api/v1/kct`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Protected API access successful!');
    console.log('📊 Found', response.data.data?.length || 0, 'curriculums');
  } catch (error) {
    console.log('❌ Protected API failed:', error.response?.status, error.response?.data?.error?.message);
  }
}

async function main() {
  const token = await testLogin();

  if (token) {
    await testProtectedAPI(token);
  }

  console.log('\n🎯 Test completed!');
}

main().catch(console.error);