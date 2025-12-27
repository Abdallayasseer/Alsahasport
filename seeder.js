const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./src/models/Admin.model");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await Admin.deleteMany();

    const masterAdmin = new Admin({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      role: "master",
    });

    const dailyAdmin = new Admin({
      username: process.env.DAILY_ADMIN_USERNAME,
      password: process.env.DAILY_ADMIN_PASSWORD,
      role: "editor",
    });

    await masterAdmin.save();
    await dailyAdmin.save();

    console.log("Admins Created: Master & Editor");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
