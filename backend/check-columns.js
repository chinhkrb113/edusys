const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

// Database configuration from .env
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
};

async function checkColumns() {
  let connection;

  try {
    console.log("🔍 Checking curriculum_frameworks table columns...");
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(
      `🗄️ Database: ${process.env.DB_DATABASE || "edusys_ai_2025_v1"}`
    );
    console.log("");

    const updatedConfig = {
      ...dbConfig,
      database: process.env.DB_DATABASE || "edusys_ai_2025_v1",
    };

    connection = await mysql.createConnection(updatedConfig);
    console.log("✅ Connected to database");

    // Check table structure
    console.log("\n📊 Current table structure:");

    const [columns] = await connection.query(
      `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'curriculum_frameworks'
      ORDER BY ORDINAL_POSITION
    `,
      [updatedConfig.database]
    );

    // Display results
    console.table(
      columns.map((col) => ({
        Column: col.COLUMN_NAME,
        Type: col.COLUMN_TYPE,
        Nullable: col.IS_NULLABLE,
        Default: col.COLUMN_DEFAULT,
        Comment: col.COLUMN_COMMENT,
      }))
    );

    // Check for new columns specifically
    console.log("\n🔍 Checking for new columns:");

    const newColumns = [
      "total_sessions",
      "session_duration_hours",
      "learning_method",
      "learning_format",
    ];
    const foundColumns = columns.filter((col) =>
      newColumns.includes(col.COLUMN_NAME)
    );

    if (foundColumns.length === newColumns.length) {
      console.log("✅ SUCCESS: All 4 new columns found!");
      foundColumns.forEach((col) => {
        console.log(
          `   ✅ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} - "${col.COLUMN_COMMENT}"`
        );
      });

      // Check for indexes on new columns
      console.log("\n📈 Checking indexes:");
      const [indexes] = await connection.query(
        `
        SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'curriculum_frameworks'
          AND COLUMN_NAME IN ('total_sessions', 'session_duration_hours', 'learning_method', 'learning_format')
      `,
        [updatedConfig.database]
      );

      if (indexes.length > 0) {
        indexes.forEach((idx) => {
          console.log(`   ✅ Index on ${idx.COLUMN_NAME}: ${idx.INDEX_NAME}`);
        });
      } else {
        console.log("   ⚠️  No indexes found for new columns");
      }
    } else {
      console.log("❌ MISSING COLUMNS:");
      newColumns.forEach((colName) => {
        const found = columns.some((col) => col.COLUMN_NAME === colName);
        console.log(`   ${found ? "✅" : "❌"} ${colName}`);
      });

      console.log("\n💡 Recommendation: Run migration again");
    }

    // Show sample data if table has rows
    const [rows] = await connection.query(
      "SELECT COUNT(*) as count FROM curriculum_frameworks"
    );
    const rowCount = rows[0].count;

    console.log(`\n📊 Table statistics:`);
    console.log(`   • Total columns: ${columns.length}`);
    console.log(`   • Total rows: ${rowCount}`);
    console.log(`   • New columns: ${foundColumns.length}/4`);

    if (rowCount > 0) {
      console.log(`\n📝 Sample data (first row):`);
      const [sampleData] = await connection.query(`
        SELECT id, code, name, total_sessions, session_duration_hours, learning_method, learning_format
        FROM curriculum_frameworks
        LIMIT 1
      `);
      if (sampleData.length > 0) {
        console.table([sampleData[0]]);
      }
    }
  } catch (error) {
    console.error("\n❌ Check failed:", error.message);
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("   💡 Check: Database credentials and network access");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("   💡 Check: Database name exists on server");
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run check
console.log("=========================================");
console.log("CHECK: Curriculum Frameworks Columns");
console.log("=========================================\n");

checkColumns()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
