const mongoose = require("mongoose");
require("dotenv").config();
const AdminService = require("./src/services/admin.service");
const { getRealIp } = require("./src/utils/ipUtils");

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const stats = await AdminService.getDashboardStats();
    console.log("Stats:", stats);

    // Test IP Logic
    const reqMock = {
      headers: {
        "cf-connecting-ip": "1.2.3.4",
        "x-forwarded-for": "5.6.7.8, 9.10.11.12",
      },
    };
    console.log("IP Test 1 (CF):", getRealIp(reqMock)); // Should be 1.2.3.4

    const reqMock2 = {
      headers: {
        "x-forwarded-for": "5.6.7.8, 9.10.11.12",
      },
    };
    console.log("IP Test 2 (XFF):", getRealIp(reqMock2)); // Should be 5.6.7.8
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

test();
