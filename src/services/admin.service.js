const ActivationCode = require("../models/ActivationCode.model");

const Admin = require("../models/Admin.model");
const Session = require("../models/Session.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { encryptCode, decryptCode } = require("../utils/encryption");
const AppError = require("../utils/AppError");

const os = require("os");
const ESTIMATED_CODE_PRICE = 10; // TODO: Move to DB/Config later

class AdminService {
  async authenticate(username, password) {
    const admin = await Admin.findOne({ username }).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new AppError("Invalid username or password", 401);
    }
    return admin;
  }

  async verifyMasterPassword(adminId, password) {
    const admin = await Admin.findById(adminId).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return false;
    }
    return true;
  }

  generateRandomCode() {
    const suffix = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()
      .slice(0, 5);
    return `ALSAHA-${suffix}`;
  }

  async createCodeInDB(adminId, { durationDays, maxDevices }, codeRaw) {
    const logger = require("../utils/logger");

    logger.info(`[createCodeInDB] Saving code for admin: ${adminId}`);

    let secret = process.env.ACTIVATION_SECRET;

    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "[createCode] CRITICAL: ACTIVATION_SECRET environment variable is not set in PRODUCTION!"
        );
        throw new AppError(
          "Server Misconfiguration: No Activation Secret. Please contact support.",
          500
        );
      } else {
        logger.warn(
          "[createCode] ACTIVATION_SECRET not set. Using insecure fallback for development."
        );
        secret = "dev_fallback_secret_do_not_use_in_prod";
      }
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(secret + codeRaw)
      .digest("hex");

    const newCode = await ActivationCode.create({
      codeHash,
      durationDays,
      maxDevices: maxDevices || 1,
      createdBy: adminId,
      codeEncrypted: encryptCode(codeRaw), // Encrypt Raw Code
    });

    const encryptedRaw = encryptCode(codeRaw);
    const displayToken = jwt.sign(
      { id: newCode._id, data: encryptedRaw, type: "display_token" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    logger.info(`[createCode] Code created successfully: ${newCode._id}`);

    return {
      newCode,
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

  async revealCode(adminId, codeId) {
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

  async deleteCode(adminId, codeId) {
    const codeDoc = await ActivationCode.findById(codeId).select(
      "+codeEncrypted"
    );
    if (!codeDoc) {
      throw new AppError("No code found with that ID", 404);
    }

    // Attempt to delete from Provider (Xtream Panel) - REMOVED for now
    // try {
    //   if (codeDoc.codeEncrypted) {
    //     const decryptedCode = decryptCode(codeDoc.codeEncrypted);
    //     if (decryptedCode) {
    //       await providerService.deleteLine(decryptedCode);
    //     }
    //   }
    // } catch (error) {
    //   require("../utils/logger").error(
    //     `Failed to delete line from provider: ${error.message}`
    //   );
    //   // Continue local deletion
    // }

    await ActivationCode.findByIdAndDelete(codeId);
    await Session.deleteMany({ userId: codeId });
    return true;
  }

  async getDashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Business Rules Implementation
    // 1. Total Code Count (ALL codes)
    // 2. Active Sessions (ALL sessions)
    // 3. Total Users (Activated: status != "unused")
    const [
      totalCodes,
      totalUsers,
      activeSessions,
      expiredCodes,
      requestsToday,
    ] = await Promise.all([
      ActivationCode.countDocuments(),
      ActivationCode.countDocuments({ status: { $ne: "unused" } }),
      Session.countDocuments(),
      ActivationCode.countDocuments({ status: "expired" }),
      Session.countDocuments({ lastActive: { $gte: startOfDay } }),
    ]);

    // 4. Revenue: Total Users * 3.82
    const revenue = totalUsers * 3.82;

    const load = os.loadavg();
    const serverLoad = load ? (load[0] * 10).toFixed(1) : 0;

    // Mock Trends
    const trends = {
      users: 12,
      sessions: 5,
      codes: 8,
      revenue: 8,
    };

    return {
      totalCodes,
      totalUsers,
      activeSessions,
      expiredCodes,
      requestsToday,
      revenue, // Sending as number
      serverLoad,
      serverStatus: "Online",
      trends,
    };
  }

  async getAnalyticsData() {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // 1. Sessions History (Mocking "Active Sessions over time" via lastActive distribution)
    // In a real app, you'd log "SessionStarted" events.
    // Here we group active sessions by hour they were last active (proxy for activity)
    const sessionsHistory = await Session.aggregate([
      { $match: { lastActive: { $gte: last24h } } },
      {
        $group: {
          _id: { $hour: "$lastActive" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing hours for last 24h
    const sessionsChart = Array.from({ length: 24 }, (_, i) => {
      const hour = (now.getHours() - (24 - i - 1) + 24) % 24;
      const found = sessionsHistory.find((h) => h._id === hour);
      return {
        time: `${hour}:00`,
        value: found ? found.count : 0, // Fallback to 0 or baseline
      };
    });

    // 2. Codes Created History (Daily)
    const codesHistory = await ActivationCode.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const codesChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const found = codesHistory.find((c) => c._id === dateStr);
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        value: found ? found.count : 0,
      };
    });

    // 3. Role Distribution
    const roleStats = await Session.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const roleDistribution = roleStats.map((r) => ({
      name: r._id,
      value: r.count,
    }));

    return {
      sessionsChart,
      codesChart,
      roleDistribution,
    };
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

    const activity = [
      ...newCodes.map((c) => ({
        id: c._id,
        type: "CODE_CREATED",
        title: "New Activation Code Generated",
        time: c.createdAt,
        status: "primary",
        details: `Created by ${c.createdBy?.username || "Admin"}`,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    return activity;
  }
}

module.exports = new AdminService();
