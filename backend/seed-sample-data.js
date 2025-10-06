const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration from .env
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_DATABASE || "edusys_ai_2025_v1",
};

async function seedSampleData() {
  let connection;

  try {
    console.log("🌱 Seeding sample data to curriculum_frameworks...");
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(`🗄️ Database: ${dbConfig.database}`);
    console.log("");

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    // Check existing data first
    const [existingData] = await connection.query(
      "SELECT COUNT(*) as count FROM curriculum_frameworks"
    );
    const existingCount = existingData[0].count;

    console.log(`\n📊 Found ${existingCount} existing records`);

    if (existingCount > 0) {
      console.log("🗑️  Clearing existing data...");
      await connection.query("DELETE FROM curriculum_frameworks");
      await connection.query(
        "ALTER TABLE curriculum_frameworks AUTO_INCREMENT = 1"
      );
      console.log("✅ All existing data cleared");
    }

    // Use tenant_id from environment (production) or default 1 (development)
    let tenantId = parseInt(process.env.TENANT_ID || "1");
    console.log(`Using tenant_id: ${tenantId}`);

    const [tenantCheck] = await connection.query(
      "SELECT id FROM tenants WHERE id = ? LIMIT 1",
      [tenantId]
    );
    if (tenantCheck.length === 0) {
      console.log(`🧵 Creating tenant with id ${tenantId}...`);
      await connection.query(
        `
        INSERT IGNORE INTO tenants (id, code, name)
        VALUES (?, ?, 'Generated Tenant')
      `,
        [tenantId, `TENANT_${tenantId}`]
      );
      console.log(`✅ Tenant ${tenantId} created`);
    }

    // Sample curriculum frameworks data (simplified)
    const sampleFrameworks = [
      {
        tenant_id: tenantId,
        code: "EN-BASIC-A1",
        name: "English Basic A1 - Foundation",
        language: "en",
        target_level: "A1",
        age_group: "kids",
        total_hours: 60,
        total_sessions: 30,
        session_duration_hours: 2.0,
        learning_method: "Tự học với hướng dẫn",
        learning_format: "Trực tuyến",
        status: "published",
        owner_user_id: null,
        description:
          "Khóa học tiếng Anh cơ bản cho trẻ em tập trung vào phát âm và từ vựng cơ bản.",
        learning_objectives: JSON.stringify([
          "Basic pronunciation",
          "Simple vocabulary",
          "Common phrases",
        ]),
        assessment_strategy: "Assessment tests every 2 weeks",
      },
      {
        tenant_id: 1,
        code: "EN-GEN-A2",
        name: "English General A2 - Elementary",
        language: "en",
        target_level: "A2",
        age_group: "teens",
        total_hours: 100,
        total_sessions: 25,
        session_duration_hours: 4.0,
        learning_method: "Theo dự án thực hành",
        learning_format: "Kết hợp",
        status: "approved",
        owner_user_id: null,
        description: "Khóa học tiếng Anh tổng quát cho thanh thiếu niên.",
        learning_objectives: JSON.stringify([
          "Daily communication",
          "Reading simple texts",
          "Writing short paragraphs",
        ]),
        assessment_strategy: "Project-based assessments",
      },
      {
        tenant_id: 1,
        code: "JP-CONV-N5",
        name: "Japanese Communication N5",
        language: "jp",
        target_level: "N5",
        age_group: "adults",
        total_hours: 120,
        total_sessions: 40,
        session_duration_hours: 3.0,
        learning_method: "Hướng dẫn theo nhóm",
        learning_format: "Trực tiếp",
        status: "published",
        owner_user_id: null,
        description: "Khóa học giao tiếp tiếng Nhật cơ bản N5.",
        learning_objectives: JSON.stringify([
          "Hiragana/Katakana mastery",
          "Basic conversation",
          "Cultural introduction",
        ]),
        assessment_strategy: "Weekly quizzes and conversation practice",
      },
      {
        tenant_id: 1,
        code: "BUSINESS-EN-B1",
        name: "Business English B1",
        language: "en",
        target_level: "B1",
        age_group: "adults",
        total_hours: 80,
        total_sessions: 20,
        session_duration_hours: 4.0,
        learning_method: "Thực hành thực tế",
        learning_format: "Trực tuyến",
        status: "draft",
        owner_user_id: null,
        description: "Khóa học tiếng Anh kinh doanh cho người đi làm.",
        learning_objectives: JSON.stringify([
          "Business vocabulary",
          "Presentation skills",
          "Email writing",
          "Meeting language",
        ]),
        assessment_strategy: "Role-play assessments and written reports",
      },
      {
        tenant_id: 1,
        code: "EN-KIDS-A0",
        name: "English for Kids A0",
        language: "en",
        target_level: "A0",
        age_group: "kids",
        total_hours: 40,
        total_sessions: 20,
        session_duration_hours: 2.0,
        learning_method: "Tự học với bài tập vui",
        learning_format: "Trực tuyến",
        status: "published",
        owner_user_id: null,
        description: "Khóa học tiếng Anh vui cho trẻ em mới bắt đầu.",
        learning_objectives: JSON.stringify([
          "Phonics",
          "Basic colors",
          "Simple greetings",
          "Animal vocabulary",
        ]),
        assessment_strategy: "Game-based assessments",
      },
      {
        tenant_id: 1,
        code: "IELTS-PRE-B2",
        name: "IELTS Preparation B2",
        language: "en",
        target_level: "B2",
        age_group: "teens",
        total_hours: 150,
        total_sessions: 30,
        session_duration_hours: 5.0,
        learning_method: "Hướng dẫn củng cố kiên trì",
        learning_format: "Kết hợp",
        status: "approved",
        owner_user_id: null,
        description: "Luyện thi IELTS cho học sinh muốn đạt band 6.5+",
        learning_objectives: JSON.stringify([
          "IELTS Reading strategies",
          "Academic Writing",
          "Listening skills",
          "Speaking fluency",
        ]),
        assessment_strategy: "Full IELTS mock tests every month",
      },
      {
        tenant_id: 1,
        code: "VI-INT-A1",
        name: "Vietnamese Intermediate A1",
        language: "vi",
        target_level: "A1",
        age_group: "adults",
        total_hours: 90,
        total_sessions: 36,
        session_duration_hours: 2.5,
        learning_method: "Theo dự án nhóm",
        learning_format: "Trực tiếp",
        status: "published",
        owner_user_id: null,
        description: "Khóa học tiếng Việt trung cấp dành cho người nước ngoài.",
        learning_objectives: JSON.stringify([
          "Complex sentences",
          "Vietnamese culture",
          "Professional vocabulary",
          "Writing skills",
        ]),
        assessment_strategy: "Portfolio assessment",
      },
      {
        tenant_id: 1,
        code: "EN-CONV-B2",
        name: "English Conversation B2",
        language: "en",
        target_level: "B2",
        age_group: "adults",
        total_hours: 70,
        total_sessions: 14,
        session_duration_hours: 5.0,
        learning_method: "Thảo luận và thực hành",
        learning_format: "Trực tuyến",
        status: "draft",
        owner_user_id: null,
        description: "Khóa học hội thoại tiếng Anh nâng cao.",
        learning_objectives: JSON.stringify([
          "Advanced conversation",
          "Debate skills",
          "Idioms and slang",
          "Cross-cultural communication",
        ]),
        assessment_strategy: "Peer-to-peer conversation assessments",
      },
      {
        tenant_id: 1,
        code: "JP-BUSINESS-N4",
        name: "Japanese Business N4",
        language: "jp",
        target_level: "N4",
        age_group: "adults",
        total_hours: 140,
        total_sessions: 35,
        session_duration_hours: 4.0,
        learning_method: "Thực hành kinh doanh thực tế",
        learning_format: "Kết hợp",
        status: "approved",
        owner_user_id: null,
        description: "Khóa học tiếng Nhật kinh doanh N4.",
        learning_objectives: JSON.stringify([
          "Business Kanji",
          "Meeting language",
          "Email communication",
          "Presentation skills",
        ]),
        assessment_strategy: "Business scenario simulations",
      },
      {
        tenant_id: 1,
        code: "EN-ACADEMIC-C1",
        name: "Academic English C1",
        language: "en",
        target_level: "C1",
        age_group: "teens",
        total_hours: 200,
        total_sessions: 40,
        session_duration_hours: 5.0,
        learning_method: "Nghiên cứu và luận văn",
        learning_format: "Trực tiếp",
        status: "published",
        owner_user_id: null,
        description: "Khóa học tiếng Anh học thuật dành cho sinh viên.",
        learning_objectives: JSON.stringify([
          "Research methodology",
          "Academic writing",
          "Critical analysis",
          "Conference presentations",
        ]),
        assessment_strategy: "Research paper and academic presentation",
      },
    ];

    console.log("\n🌱 Inserting 10 sample curriculum frameworks...");

    const insertQuery = `
      INSERT INTO curriculum_frameworks (
        tenant_id, code, name, language, target_level, age_group,
        total_hours, total_sessions, session_duration_hours,
        learning_method, learning_format,
        status, owner_user_id, description, learning_objectives,
        assessment_strategy, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let insertedCount = 0;
    for (const framework of sampleFrameworks) {
      try {
        await connection.query(insertQuery, [
          framework.tenant_id,
          framework.code,
          framework.name,
          framework.language,
          framework.target_level,
          framework.age_group,
          framework.total_hours,
          framework.total_sessions,
          framework.session_duration_hours,
          framework.learning_method,
          framework.learning_format,
          framework.status,
          framework.owner_user_id,
          framework.description,
          framework.learning_objectives,
          framework.assessment_strategy,
          1, // created_by
          1, // updated_by
        ]);
        insertedCount++;
        console.log(`✅ Inserted: ${framework.code} - ${framework.name}`);
      } catch (insertError) {
        console.error(
          `❌ Failed to insert ${framework.code}:`,
          insertError.message
        );
      }
    }

    console.log(
      `\n🎉 Successfully inserted ${insertedCount}/10 sample frameworks`
    );

    // Verify the data
    console.log("\n📊 Verification - Sample records:");
    const [results] = await connection.query(`
      SELECT
        id, code, name, total_sessions, session_duration_hours,
        learning_method, learning_format, status
      FROM curriculum_frameworks
      WHERE id <= 10
      ORDER BY id
    `);

    console.table(
      results.map((row) => ({
        ID: row.id,
        Code: row.code,
        Name: row.name.substring(0, 20) + "...",
        Sessions: row.total_sessions,
        "Hours/Session": row.session_duration_hours,
        Method: row.learning_method,
        Format: row.learning_format,
        Status: row.status,
      }))
    );

    const [stats] = await connection.query(`
      SELECT
        COUNT(*) as total_records,
        SUM(total_sessions) as total_sessions_sum,
        AVG(session_duration_hours) as avg_duration,
        COUNT(DISTINCT learning_method) as unique_methods,
        COUNT(DISTINCT learning_format) as unique_formats
      FROM curriculum_frameworks
    `);

    console.log("\n📈 Statistics:");
    console.log(`   • Total records: ${stats[0].total_records}`);
    console.log(
      `   • Total sessions across all: ${stats[0].total_sessions_sum}`
    );
    console.log(
      `   • Average session duration: ${stats[0].avg_duration} hours`
    );
    console.log(`   • Unique learning methods: ${stats[0].unique_methods}`);
    console.log(`   • Unique learning formats: ${stats[0].unique_formats}`);

    console.log("\n✅ Sample data seeding completed successfully!");
    console.log(
      "📚 You now have realistic sample curriculum frameworks with the new fields!"
    );
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
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

// Run seeding
console.log("=========================================");
console.log("SEEDING: Sample Curriculum Framework Data");
console.log("=========================================\n");

seedSampleData()
  .then(() => {
    console.log("\n✅ Seeding script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding script failed:", error);
    process.exit(1);
  });
