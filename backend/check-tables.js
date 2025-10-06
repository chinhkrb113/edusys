const mysql = require('mysql2/promise');

async function checkTables() {
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

    // Check if games table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'games'"
    );

    if (tables.length === 0) {
      console.log('❌ Games table does not exist');
      return;
    }

    console.log('✅ Games table exists');

    // Check table structure
    const [columns] = await connection.execute(
      "DESCRIBE games"
    );

    console.log('📋 Games table columns:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if there are any rows
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM games WHERE tenant_id = 104"
    );

    console.log(`📊 Games count for tenant 104: ${rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();