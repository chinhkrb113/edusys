const axios = require("axios");
const jwt = require("jsonwebtoken");

const BASE_URL = "http://localhost:3001";

async function debugKCTAPI() {
  console.log("🔍 Testing updated KCT API with target_level...");

  try {
    // Login first
    console.log("1️⃣ Logging in...");
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = response.data.access_token;
    console.log("✅ Login successful");

    // Test KCT API
    console.log("\n2️⃣ Calling GET /api/v1/kct...");
    const kctResponse = await axios.get(`${BASE_URL}/api/v1/kct`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`📊 Found ${kctResponse.data.data.length} curriculums`);

    if (kctResponse.data.data.length > 0) {
      console.log("\n📋 First curriculum (now with target_level):");
      const firstItem = kctResponse.data.data[0];
      console.log(
        JSON.stringify(
          {
            id: firstItem.id,
            code: firstItem.code,
            name: firstItem.name,
            target_level: firstItem.target_level,
            age_group: firstItem.age_group,
            description: firstItem.description,
            status: firstItem.status,
          },
          null,
          2
        )
      );
    }

    console.log("\n✅ Done - target_level should now be included!");
  } catch (error) {
    console.error("❌ Error:", error.response?.status, error.response?.data);
  }
}

debugKCTAPI();
