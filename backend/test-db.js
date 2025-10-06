const mysql = require('mysql2/promise');

async function testConnection() {
  const config = {
    host: '45.32.100.86',
    port: 3306,
    user: 'root',
    password: 'Tepa@123456',
    database: 'edusys_ai_2025_v1',
    connectTimeout: 5000,
  };

  console.log('Testing database connection...');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Database:', config.database);
  console.log('User:', config.user);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');

    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);

    await connection.end();
    console.log('✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Possible issues:');
      console.log('1. MySQL server is not running');
      console.log('2. Firewall blocking port 3306');
      console.log('3. Wrong host IP or port');
      console.log('4. Network connectivity issues');
    }
  }
}

testConnection();