const mysql = require('mysql2/promise');

async function testQuery() {
  const config = {
    host: '45.32.100.86',
    port: 3306,
    user: 'root',
    password: 'Tepa@123456',
    database: 'edusys_ai_2025_v1',
    connectTimeout: 5000,
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Test the exact query from games.ts
    const sql = `SELECT id, tenant_id, title, type, level, skill, duration_minutes, players, description,
            plays_count, rating, api_integration, tags, created_by, updated_by, created_at, updated_at
     FROM games
     WHERE tenant_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`;

    const params = [104, 6, 0];

    console.log('SQL:', sql);
    console.log('Params:', params);

    // Try with execute
    try {
      const [rows] = await connection.execute(sql, params);
      console.log('✅ Execute successful!');
      console.log('Rows:', rows.length);
    } catch (execError) {
      console.log('❌ Execute failed, trying query...');
      // Try with query instead
      const [rows2] = await connection.query(sql, params);
      console.log('✅ Query successful!');
      console.log('Rows:', rows2.length);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
    console.error('Errno:', error.errno);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testQuery();