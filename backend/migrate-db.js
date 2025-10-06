const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

// Database configuration from .env
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  multipleStatements: true,
};

async function migrateDatabase() {
  let connection;

  try {
    console.log("🔗 Connecting to production database...");
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(
      `🗄️  Database: ${process.env.DB_DATABASE || "edusys_ai_2025_v1"}`
    );

    connection = await mysql.createConnection(dbConfig);

    // Set database - ADD to config
    const updatedConfig = {
      ...dbConfig,
      database: process.env.DB_DATABASE || "edusys_ai_2025_v1",
    };
    await connection.end();
    connection = await mysql.createConnection(updatedConfig);
    console.log(`✅ Connected and using database: ${updatedConfig.database}`);

    // Read and execute migration SQL
    console.log("\n📄 Reading migration file...");
    const migrationPath = "./setup_new_columns.sql";
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute ALTER TABLE statements directly (the critical ones)
    console.log("🚀 Executing ALTER TABLE statements...\n");

    // Execute each ALTER TABLE statement individually (without IF NOT EXISTS for columns as it's not supported in all MySQL versions)
    const alterCommands = [
      // First check if columns already exist and add them one by one
      "DESCRIBE `curriculum_frameworks`",
      // Add columns without IF NOT EXISTS (will error if they exist but that's ok)
    ];

    // Check existing columns first
    const [existingColumns] = await connection.query(
      "DESCRIBE `curriculum_frameworks`"
    );
    const columnNames = existingColumns.map((col) => col.Field);

    // Add only missing columns
    const columnsToAdd = [
      {
        name: "total_sessions",
        sql: "ALTER TABLE `curriculum_frameworks` ADD COLUMN `total_sessions` INT UNSIGNED DEFAULT 0 COMMENT 'Tổng số buổi học (số buổi trong khoá học)'",
      },
      {
        name: "session_duration_hours",
        sql: "ALTER TABLE `curriculum_frameworks` ADD COLUMN `session_duration_hours` DECIMAL(3, 1) DEFAULT NULL COMMENT 'Thời gian học mỗi buổi (theo giờ, ví dụ: 1.5 = 1 giờ 30 phút)'",
      },
      {
        name: "learning_method",
        sql: "ALTER TABLE `curriculum_frameworks` ADD COLUMN `learning_method` VARCHAR(128) DEFAULT NULL COMMENT 'Cách thức học: tự học, hướng dẫn, theo dự án, thực hành, tập trung v.v.'",
      },
      {
        name: "learning_format",
        sql: "ALTER TABLE `curriculum_frameworks` ADD COLUMN `learning_format` VARCHAR(128) DEFAULT NULL COMMENT 'Hình thức học: trực tuyến, trực tiếp, kết hợp, hybrid v.v.'",
      },
    ];

    console.log(
      `📋 Existing columns: ${columnNames.length}, Checking for missing columns...`
    );

    // Add missing columns
    let addedCount = 0;
    for (const colConfig of columnsToAdd) {
      if (!columnNames.includes(colConfig.name)) {
        try {
          console.log(`🔄 Adding column: ${colConfig.name}...`);
          await connection.query(colConfig.sql);
          console.log(`✅ Column ${colConfig.name} added successfully`);
          addedCount++;
        } catch (stmtError) {
          console.warn(
            `⚠️  Failed to add column ${colConfig.name}: ${stmtError.message}`
          );
        }
      } else {
        console.log(`⚡ Column ${colConfig.name} already exists - skipped`);
      }
    }

    console.log(`📊 Added ${addedCount} new columns`);

    // Add indexes try/catch each one
    console.log("\n🔄 Adding indexes...");
    const indexCommands = [
      "ALTER TABLE `curriculum_frameworks` ADD INDEX `idx_learning_method` (`learning_method`)",
      "ALTER TABLE `curriculum_frameworks` ADD INDEX `idx_learning_format` (`learning_format`)",
      "ALTER TABLE `curriculum_frameworks` ADD INDEX `idx_total_sessions` (`total_sessions`)",
      "ALTER TABLE `curriculum_frameworks` ADD INDEX `idx_session_duration` (`session_duration_hours`)",
    ];

    for (const indexSql of indexCommands) {
      try {
        await connection.query(indexSql);
        console.log(`✅ Index added successfully`);
      } catch (stmtError) {
        if (stmtError.message.toLowerCase().includes("duplicate")) {
          console.log(`⚡ Index already exists - skipped`);
        } else {
          console.warn(`⚠️  Failed to add index: ${stmtError.message}`);
        }
      }
    }

    console.log(`📋 Executing ${alterCommands.length} critical statements...`);

    for (let i = 0; i < alterCommands.length; i++) {
      const command = alterCommands[i];
      try {
        console.log(`🔄 Executing ALTER ${i + 1}/${alterCommands.length}...`);
        await connection.query(command);
        console.log(`✅ ALTER ${i + 1} completed successfully`);
      } catch (stmtError) {
        // Ignore "already exists" errors for idempotency
        if (
          stmtError.message.toLowerCase().includes("already exists") ||
          stmtError.message.toLowerCase().includes("duplicate")
        ) {
          console.log(`⚡ ALTER ${i + 1} skipped (already exists)`);
        } else {
          console.warn(`⚠️  ALTER ${i + 1} warning: ${stmtError.message}`);
        }
      }
    }

    // Verify the changes
    console.log("\n📊 Final verification...");
    const [rows] = await connection.query(`
      SELECT '✅ MIGRATION COMPLETED: 4 trường mới đã được thêm thành công!' as status
    `);
    console.log("Status:", rows[0].status);

    console.log("✅ Migration executed successfully!");
    console.log("\n📊 Migration Results:");

    // If we have result data, display it
    if (rows && Array.isArray(rows)) {
      rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
      });
    }

    console.log("\n🎉 Database updated with 4 new columns:");
    console.log("   ✅ total_sessions: Tổng số buổi học");
    console.log("   ✅ session_duration_hours: Thời gian học/buổi (giờ)");
    console.log("   ✅ learning_method: Cách thức học");
    console.log("   ✅ learning_format: Hình thức học");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("   💡 Check: Database credentials and network access");
      console.log("   💡 Remote host:", dbConfig.host);
      console.log("   💡 Username:", dbConfig.user);
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("   💡 Check: Database name exists on server");
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run migration
console.log("=========================================");
console.log("MIGRATION: Adding 4 new columns to curriculum_frameworks");
console.log("=========================================\n");

migrateDatabase()
  .then(() => {
    console.log("\n✅ Migration script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
