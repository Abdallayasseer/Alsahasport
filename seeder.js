const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./src/models/Admin.model");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // 1. 
    await Admin.deleteMany();

    // 2. 

    const adminUser = new Admin({
      username: process.env.ADMIN_USERNAME,  
      password: process.env.ADMIN_PASSWORD, 
    });

    await adminUser.save();

    console.log("Admin Imported Successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
