const mongoose = require("mongoose");
require("dotenv").config();
const AdminService = require("./src/services/admin.service");

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    console.log("--- Dashboard Stats with Trends ---");
    const stats = await AdminService.getDashboardStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n--- Analytics Data ---");
    const analytics = await AdminService.getAnalyticsData();
    console.log(JSON.stringify(analytics, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

test();
