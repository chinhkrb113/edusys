const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupTestUser() {
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
    console.log('🔧 Setting up test user...');
    console.log('📡 Connecting to database...');

    connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful');

    // Check if test user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['test@example.com']
    );

    if (existingUsers.length > 0) {
      console.log('ℹ️  Test user already exists, updating schema only');
      // Still run schema updates even if user exists
    }

    // Check if tenant exists, create if not
    const [tenants] = await connection.execute(
      'SELECT id FROM tenants WHERE code = ?',
      ['TEST_TENANT']
    );

    let tenantId;
    if (tenants.length === 0) {
      console.log('🏢 Creating test tenant...');
      const [tenantResult] = await connection.execute(
        'INSERT INTO tenants (code, name, is_active) VALUES (?, ?, ?)',
        ['TEST_TENANT', 'Test Tenant', 1]
      );
      tenantId = tenantResult.insertId;
      console.log(`✅ Created tenant with ID: ${tenantId}`);
    } else {
      tenantId = tenants[0].id;
      console.log(`ℹ️  Using existing tenant ID: ${tenantId}`);
    }

    // Check if campus exists, create if not
    const [campuses] = await connection.execute(
      'SELECT id FROM campuses WHERE tenant_id = ? AND code = ?',
      [tenantId, 'TEST_CAMPUS']
    );

    let campusId;
    if (campuses.length === 0) {
      console.log('🏫 Creating test campus...');
      const [campusResult] = await connection.execute(
        'INSERT INTO campuses (tenant_id, code, name, is_active) VALUES (?, ?, ?, ?)',
        [tenantId, 'TEST_CAMPUS', 'Test Campus', 1]
      );
      campusId = campusResult.insertId;
      console.log(`✅ Created campus with ID: ${campusId}`);
    } else {
      campusId = campuses[0].id;
      console.log(`ℹ️  Using existing campus ID: ${campusId}`);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // First, add missing columns to users table
    console.log('🔧 Adding missing columns to users table...');

    try {
      await connection.execute(
        'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER campus_id'
      );
      console.log('✅ Added password_hash column');
    } catch (error) {
      console.log('ℹ️  password_hash column already exists or error:', error.message);
    }

    try {
      await connection.execute(
        'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL AFTER preferences'
      );
      console.log('✅ Added deleted_at column');
    } catch (error) {
      console.log('ℹ️  deleted_at column already exists or error:', error.message);
    }

    // Create test user
    console.log('👤 Creating test user...');
    const [userResult] = await connection.execute(
      `INSERT INTO users (
        tenant_id, email, full_name, role, campus_id, password_hash, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, 'test@example.com', 'Test User', 'admin', campusId, hashedPassword, 1]
    );

    const userId = userResult.insertId;
    console.log(`✅ Created test user with ID: ${userId}`);

    console.log('\n🎉 Test user setup complete!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: admin');
    console.log('🏢 Tenant ID:', tenantId);
    console.log('🏫 Campus ID:', campusId);

  } catch (error) {
    console.error('❌ Error setting up test user:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run setup
setupTestUser().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});