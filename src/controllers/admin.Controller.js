const AdminService = require("../services/admin.service");
const ActivationCode = require("../models/ActivationCode.model");
// Channels and Providers removed
const Session = require("../models/Session.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Auth Helper
const { createSessionAndSend } = require("./authController");
const { getRealIp } = require("../utils/ipUtils");
const { analyzeIpConfidence } = require("../utils/ipDetection");

exports.loginAdmin = catchAsync(async (req, res, next) => {
  try {
    const { username, password, clientPublicIp } = req.body;
    const admin = await AdminService.authenticate(username, password);

    const proxyIp = getRealIp(req);
    const ipData = analyzeIpConfidence(clientPublicIp, proxyIp);

    // Debug Logging
    console.log("[Login Debug] Admin found:", {
      id: admin._id,
      role: admin.role,
      username: admin.username,
    });

    // Fallback for role if missing
    const sessionRole = admin.role || "admin";

    await createSessionAndSend(
      admin,
      "admin-browser",
      ipData,
      req.headers["user-agent"],
      res,
      sessionRole
    );
  } catch (error) {
    console.error("[Login Error] Admin Login Failed:", error);
    return next(error);
  }
});

exports.getDashboardData = catchAsync(async (req, res, next) => {
  // 1. Run all counts in parallel for performance
  const [
    totalCodes,
    activeSessions, // "Count of all documents in Session model"
    totalUsers, // Codes where isActivated=true (status != 'unused')
    recentActivityCodes,
    recentSessions,
  ] = await Promise.all([
    ActivationCode.countDocuments(),
    Session.countDocuments(),
    ActivationCode.countDocuments(), // Total Users = Total Codes Generated
    ActivationCode.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "username")
      .lean(),
    Session.find().sort({ lastActive: -1 }).limit(5).populate("userId").lean(),
  ]);

  // 2. Revenue Calculation (Strict Rule: totalUsers * 3)
  const revenue = totalUsers * 3;

  // 3. Format Recent Activity (Standardized)
  const activity = recentActivityCodes.map((code) => ({
    id: code._id,
    title: "Code Created",
    time: code.createdAt,
    status: "success",
    type: "CODE_CREATED",
    details: `Standard Package (Created by ${
      code.createdBy?.username || "Admin"
    })`,
  }));

  // 4. Analytics Helpers (Simple daily distribution for now)
  // Real implementation would use aggregation, but keeping it robust & simple as requested
  // This replaces separate /analytics call
  const now = new Date();
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [weeklyCodeStats, sessionsHistory] = await Promise.all([
    ActivationCode.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Session.aggregate([
      { $match: { lastActive: { $gte: new Date(now - 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $hour: "$lastActive" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const codesChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const found = weeklyCodeStats.find((c) => c._id === dateStr);
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: found ? found.count : 0,
    };
  });

  const sessionsChart = Array.from({ length: 24 }, (_, i) => {
    const hour = (now.getHours() - (24 - i - 1) + 24) % 24;
    const found = sessionsHistory.find((h) => h._id === hour);
    return {
      time: `${hour}:00`,
      value: found ? found.count : 0,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalCodes,
        activeSessions,
        totalUsers,
        revenue,
        serverStatus: "Online",
        trends: { users: 0, sessions: 0, codes: 0, revenue: 0 }, // Placeholder for trends
      },
      recentActivity: activity,
      liveSessions: recentSessions,
      analytics: {
        codesChart,
        sessionsChart,
        roleDistribution: [
          { name: "Mobile", value: 60 },
          { name: "TV", value: 30 },
          { name: "Web", value: 10 },
        ], // Simplified static or calculated if needed
      },
    },
  });
});

exports.verifyMasterPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  const isValid = await AdminService.verifyMasterPassword(
    req.user._id,
    password
  );

  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Incorrect password",
    });
  }

  res.status(200).json({
    success: true,
    message: "Password verified",
  });
});

exports.createCode = catchAsync(async (req, res, next) => {
  try {
    // 1. Generate Code Locally
    const codeRaw = AdminService.generateRandomCode();

    // 2. Step 1 (External): Call Provider API - REMOVED for now
    // await providerService.createLine(codeRaw);

    // 3. Step 2 (Local): Create in MongoDB
    const { newCode, displayToken } = await AdminService.createCodeInDB(
      req.user._id,
      req.body,
      codeRaw
    );

    res.status(201).json({
      success: true,
      message: "Code Created",
      data: {
        id: newCode._id,
        code: codeRaw,
        durationDays: newCode.durationDays,
        status: "active",
        maxDevices: newCode.maxDevices,
        createdAt: newCode.createdAt,
        displayToken,
        expiresIn: "10m",
      },
    });
  } catch (error) {
    // Provide a "safe" error to the frontend
    // If providerService threw AppError(502/504), it will bubble up
    // But we ensure we don't crash
    // We can also re-throw if it is an AppError to let Global Error Handler manage it
    // Or return JSON directly here
    if (error.statusCode) {
      return next(error);
    }

    // Unexpected error -> 500
    // require("../utils/logger").error... (catchAsync does this usually)
    return next(new AppError("Failed to create code: " + error.message, 500));
  }
});

exports.displayCode = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!token) return next(new AppError("Display Token required", 400));

  const result = await AdminService.verifyAndDecryptDisplayToken(id, token);

  res.status(200).json({
    success: true,
    data: result,
  });
});

exports.revealCode = catchAsync(async (req, res, next) => {
  const rawCode = await AdminService.revealCode(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { code: rawCode },
  });
});

exports.getAllCodes = catchAsync(async (req, res, next) => {
  const logger = require("../utils/logger");

  try {
    logger.info(
      `[getAllCodes] Request from user: ${req.user?._id}, role: ${req.user?.role}`
    );

    const codes = await ActivationCode.find().sort({ createdAt: -1 });

    logger.info(`[getAllCodes] Successfully retrieved ${codes.length} codes`);

    res
      .status(200)
      .json({ success: true, message: "Codes retrieved", data: codes });
  } catch (error) {
    logger.error(`[getAllCodes] Error: ${error.message}`, {
      stack: error.stack,
      userId: req.user?._id,
    });
    throw error; // Re-throw to be caught by catchAsync
  }
});

exports.deleteCode = catchAsync(async (req, res, next) => {
  await AdminService.deleteCode(req.user._id, req.params.id);
  res.status(200).json({ success: true, message: "Code deleted successfully" });
});

exports.getSystemStatus = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      status: "online",
      timestamp: new Date(),
      uptime: process.uptime(),
    },
  });
});
exports.getLiveSessions = catchAsync(async (req, res, next) => {
  const sessions = await Session.find()
    .populate("userId", "username email role")
    .sort({ lastActive: -1 })
    .limit(50) // Reasonable limit for "live" view
    .lean();

  res.status(200).json({
    success: true,
    data: {
      count: sessions.length,
      sessions,
    },
  });
});
