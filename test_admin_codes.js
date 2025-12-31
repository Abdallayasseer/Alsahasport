/**
 * Test script to verify the /api/admin/codes endpoint
 * This will:
 * 1. Login as admin
 * 2. Fetch all codes
 * 3. Display results and any errors
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testAdminCodes() {
  try {
    console.log("🔐 Step 1: Logging in as admin...");

    // Login with default admin credentials (adjust if needed)
    const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
      username: "master_admin",
      password: "master123",
    });

    const accessToken = loginResponse.data.accessToken;
    console.log("✅ Login successful!");
    console.log("   Token:", accessToken.substring(0, 20) + "...");

    console.log("\n📋 Step 2: Fetching codes...");

    // Fetch codes with authorization header
    const codesResponse = await axios.get(`${BASE_URL}/admin/codes`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("✅ Codes retrieved successfully!");
    console.log("   Status:", codesResponse.status);
    console.log("   Count:", codesResponse.data.data.length);
    console.log("\n📊 Codes:");
    console.log(JSON.stringify(codesResponse.data.data, null, 2));
  } catch (error) {
    console.error("❌ Error occurred:");

    if (error.response) {
      // Server responded with error status
      console.error("   Status:", error.response.status);
      console.error(
        "   Message:",
        error.response.data.message || error.response.data
      );
      console.error(
        "   Full response:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      // Request was made but no response
      console.error("   No response from server");
      console.error("   Request:", error.request);
    } else {
      // Something else happened
      console.error("   Error:", error.message);
    }

    process.exit(1);
  }
}

// Run the test
console.log("🚀 Testing /api/admin/codes endpoint\n");
testAdminCodes();
