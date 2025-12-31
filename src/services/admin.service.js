const ActivationCode = require("../models/ActivationCode.model");
const Channel = require("../models/Channel.model");
const Admin = require("../models/Admin.model");
const Session = require("../models/Session.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { encryptCode, decryptCode } = require("../utils/encryption");
const AppError = require("../utils/AppError");

class AdminService {
  async authenticate(username, password) {
    const admin = await Admin.findOne({ username }).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new AppError("Invalid username or password", 401);
    }
    return admin;
  }

  async createCode(adminId, { durationDays, maxDevices }) {
    const codeRaw = crypto.randomBytes(6).toString("hex").toUpperCase();
    const secret = process.env.ACTIVATION_SECRET;
    if (!secret)
      throw new AppError("Server Misconfiguration: No Activation Secret", 500);

    const codeHash = crypto
      .createHash("sha256")
      .update(secret + codeRaw)
      .digest("hex");

    const newCode = await ActivationCode.create({
      codeHash,
      durationDays,
      maxDevices: maxDevices || 1,
      createdBy: adminId,
      codeEncrypted: encryptCode(codeRaw),
    });

    const encryptedRaw = encryptCode(codeRaw);
    const displayToken = jwt.sign(
      { id: newCode._id, data: encryptedRaw, type: "display_token" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return {
      newCode,
      codeRaw,
      displayToken,
    };
  }

  async verifyAndDecryptDisplayToken(id, token) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        throw new AppError("Display Token Expired", 410);
      throw new AppError("Invalid Token", 401);
    }

    if (decoded.type !== "display_token")
      throw new AppError("Invalid Token Type", 400);

    if (decoded.id !== id)
      throw new AppError("Token mismatch for this Code ID", 400);

    const codeDoc = await ActivationCode.findById(id);
    if (!codeDoc) throw new AppError("Code not found", 404);

    if (codeDoc.viewed) {
      throw new AppError(
        "Code already displayed. Cannot be viewed again.",
        410
      );
    }

    codeDoc.viewed = true;
    await codeDoc.save();

    try {
      return { id: codeDoc._id, code: decryptCode(decoded.data) };
    } catch (e) {
      throw new AppError("Decryption Failed", 500);
    }
  }

  async revealCode(adminId, codeId, password) {
    // Verify Admin Password
    const admin = await Admin.findById(adminId).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new AppError("Incorrect password", 401);
    }

    // Fetch Code
    const codeDoc = await ActivationCode.findById(codeId).select(
      "+codeEncrypted"
    );
    if (!codeDoc) throw new AppError("Code not found", 404);

    if (!codeDoc.codeEncrypted) {
      throw new AppError("This code is too old and cannot be revealed.", 400);
    }

    try {
      return decryptCode(codeDoc.codeEncrypted);
    } catch (err) {
      throw new AppError("Decryption failed", 500);
    }
  }

  async getDashboardStats() {
    const totalCodes = await ActivationCode.countDocuments();
    const activeSessions = await Session.countDocuments();
    const revenue = totalCodes * 10;
    const serverLoad = Math.floor(Math.random() * 30) + 10;

    return { totalCodes, activeSessions, revenue, serverLoad };
  }

  async getWeeklyStats() {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    return ActivationCode.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecentActivity() {
    const newCodes = await ActivationCode.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "username");
    const newChannels = await Channel.find().sort({ createdAt: -1 }).limit(5);

    const activity = [
      ...newCodes.map((c) => ({
        id: c._id,
        type: "CODE_CREATED",
        title: "New Activation Code Generated",
        time: c.createdAt,
        status: "primary",
        details: `Created by ${c.createdBy?.username || "Admin"}`,
      })),
      ...newChannels.map((c) => ({
        id: c._id,
        type: "CHANNEL_ADDED",
        title: `New Channel '${c.name}' Added`,
        time: c.createdAt,
        status: "success",
        details: c.category,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    return activity;
  }
}

module.exports = new AdminService();
