const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogin() {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  return response.data.access_token;
}

async function testGamesAPI(token) {
  console.log('🎮 Testing Games API...');

  try {
    const response = await axios.get(`${BASE_URL}/api/v1/games?page=1&pageSize=6`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Games API successful!');
    console.log('📊 Found', response.data.data?.length || 0, 'games');
    console.log('📄 Pagination:', response.data.pagination);
  } catch (error) {
    console.log('❌ Games API failed:', error.response?.status, error.response?.data?.error?.message);
    console.log('Stack:', error.response?.data?.error?.stack);
  }
}

async function main() {
  const token = await testLogin();
  await testGamesAPI(token);
  console.log('🎯 Test completed!');
}

main().catch(console.error);