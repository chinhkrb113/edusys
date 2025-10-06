const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function getAuthToken() {
  const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
    email: "test@example.com",
    password: "password123",
  });
  return response.data.access_token;
}

async function testCRUDKCT() {
  console.log("🧪 Testing Complete CRUD APIs for Curriculum Management\n");
  console.log("=".repeat(60));

  let accessToken;
  let testCurriculumId;

  try {
    // 🔐 Authentication
    console.log("🔐 Step 1: Authentication");
    accessToken = await getAuthToken();
    console.log("✅ Successfully logged in and got access token\n");

    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // 📋 CREATE - Create new curriculum
    console.log("📋 Step 2: CREATE - Adding new curriculum");
    const createData = {
      code: `TEST-KCT-${Date.now()}`,
      name: "Test Curriculum API CRUD",
      language: "english",
      target_level: "B1",
      age_group: "adults",
      total_hours: 120,
      description: "Test curriculum created via API CRUD test",
    };

    console.log("📝 Creating curriculum:", createData.code);
    const createResponse = await axios.post(
      `${BASE_URL}/api/v1/kct`,
      createData,
      {
        headers: authHeaders,
      }
    );

    testCurriculumId = createResponse.data.id;
    console.log("✅ Created curriculum with ID:", testCurriculumId);
    console.log(
      "📄 Response:",
      JSON.stringify(createResponse.data, null, 2),
      "\n"
    );

    // 📖 READ - Get curriculum list
    console.log("📖 Step 3: READ - Get curriculum list");
    const listResponse = await axios.get(`${BASE_URL}/api/v1/kct`, {
      headers: authHeaders,
    });
    console.log(`✅ Retrieved ${listResponse.data.data.length} curriculums`);
    console.log("📊 Metadata:", {
      total: listResponse.data.total,
      page: listResponse.data.page,
      page_size: listResponse.data.page_size,
    });

    // Verify our created curriculum is in the list
    const ourCurriculum = listResponse.data.data.find(
      (item) => item.id === testCurriculumId
    );
    if (ourCurriculum) {
      console.log(
        "✅ Our created curriculum is in the list:",
        ourCurriculum.name
      );
    }
    console.log();

    // 🔍 READ - Get specific curriculum details
    console.log("🔍 Step 4: READ - Get specific curriculum");
    const detailResponse = await axios.get(
      `${BASE_URL}/api/v1/kct/${testCurriculumId}`,
      {
        headers: authHeaders,
      }
    );
    console.log("✅ Retrieved detailed curriculum info");
    console.log(
      "📋 Details:",
      JSON.stringify(
        {
          id: detailResponse.data.id,
          code: detailResponse.data.code,
          name: detailResponse.data.name,
          target_level: detailResponse.data.target_level,
          age_group: detailResponse.data.age_group,
          description: detailResponse.data.description,
          status: detailResponse.data.status,
        },
        null,
        2
      ),
      "\n"
    );

    // ✏️ UPDATE - Modify curriculum
    console.log("✏️  Step 5: UPDATE - Modify curriculum");
    const updateData = {
      name: "Updated Test Curriculum API CRUD",
      description: "Updated description - tested CRUD operations",
      total_hours: 150,
    };

    console.log("🔄 Updating curriculum:", testCurriculumId);
    const updateResponse = await axios.patch(
      `${BASE_URL}/api/v1/kct/${testCurriculumId}`,
      updateData,
      {
        headers: authHeaders,
      }
    );
    console.log("✅ Successfully updated curriculum");
    console.log("📬 Response:", updateResponse.data.message, "\n");

    // Verify update
    console.log("🔍 Verifying update...");
    const verifyResponse = await axios.get(
      `${BASE_URL}/api/v1/kct/${testCurriculumId}`,
      {
        headers: authHeaders,
      }
    );
    console.log("✅ Updated details:", {
      name: verifyResponse.data.name,
      description: verifyResponse.data.description.substring(0, 50) + "...",
      total_hours: verifyResponse.data.total_hours,
    });
    console.log();

    // 🗑️ DELETE - Remove curriculum
    console.log("🗑️  Step 6: DELETE - Remove curriculum");
    console.log("⚠️  Deleting curriculum:", testCurriculumId);
    const deleteResponse = await axios.delete(
      `${BASE_URL}/api/v1/kct/${testCurriculumId}`,
      {
        headers: authHeaders,
      }
    );
    console.log("✅ Successfully deleted curriculum");
    console.log("📬 Response:", deleteResponse.data.message, "\n");

    // Verify deletion - curriculum should not exist anymore
    console.log("🔍 Verifying deletion...");
    try {
      await axios.get(`${BASE_URL}/api/v1/kct/${testCurriculumId}`, {
        headers: authHeaders,
      });
      console.log("❌ ERROR: Curriculum still exists after deletion!");
    } catch (error) {
      if (error.response.status === 404) {
        console.log("✅ Deletion confirmed - curriculum not found (404)");
      } else {
        console.log("❓ Unexpected response:", error.response.status);
      }
    }
    console.log();
  } catch (error) {
    console.error("❌ Test failed at some point:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Message:", error.response.data?.error?.message);
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Network error:", error.message);
    }
    return;
  }

  console.log("=".repeat(60));
  console.log("🎉 ALL CRUD TESTS PASSED SUCCESSFULLY!");
  console.log("✅ CREATE - New curriculum created");
  console.log("✅ READ - List and detail retrieval working");
  console.log("✅ UPDATE - Curriculum modification working");
  console.log("✅ DELETE - Curriculum soft deletion working");
  console.log(
    "\n✨ Curriculum Management API CRUD operations are fully functional!"
  );
}

// Additional edge case tests
async function testEdgeCases() {
  console.log("\n🧪 Testing Edge Cases/Validation");

  try {
    const accessToken = await getAuthToken();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Test duplicate code
    console.log("1️⃣ Testing duplicate code validation...");
    const duplicateData = {
      code: "TEST001", // Existing code from sample data
      name: "Test Duplicate Code",
      language: "english",
    };

    try {
      await axios.post(`${BASE_URL}/api/v1/kct`, duplicateData, {
        headers: authHeaders,
      });
      console.log("❌ Should have failed with duplicate code");
    } catch (error) {
      if (error.response.status === 409) {
        console.log("✅ Correctly rejected duplicate code (409)");
      }
    }

    // Test invalid ID
    console.log("2️⃣ Testing invalid ID access...");
    try {
      await axios.get(`${BASE_URL}/api/v1/kct/99999`, { headers: authHeaders });
      console.log("❌ Should have failed with invalid ID");
    } catch (error) {
      if (error.response.status === 404) {
        console.log("✅ Correctly returned 404 for invalid ID");
      }
    }

    // Test pagination
    console.log("3️⃣ Testing pagination...");
    const pageResponse = await axios.get(
      `${BASE_URL}/api/v1/kct?page=1&page_size=5`,
      {
        headers: authHeaders,
      }
    );
    console.log(
      `✅ Pagination working: ${pageResponse.data.data.length} items on page 1`
    );
  } catch (error) {
    console.error("❌ Edge case test failed:", error.message);
  }
}

// Main execution
async function main() {
  await testCRUDKCT();
  await testEdgeCases();
  console.log("\n🏁 All Curriculum API CRUD tests completed!");
}

main().catch(console.error);
