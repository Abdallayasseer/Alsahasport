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
  const { username, password, clientPublicIp } = req.body;
  const admin = await AdminService.authenticate(username, password);

  const proxyIp = getRealIp(req);
  const ipData = analyzeIpConfidence(clientPublicIp, proxyIp);

  await createSessionAndSend(
    admin,
    "admin-browser",
    ipData,
    req.headers["user-agent"],
    res,
    admin.role
  );
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

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const stats = await AdminService.getDashboardStats();
  res.status(200).json({ success: true, data: stats });
});

exports.getWeeklyCodeStats = catchAsync(async (req, res, next) => {
  const stats = await AdminService.getWeeklyStats();
  res.status(200).json({ success: true, data: stats });
});

exports.getAnalyticsData = catchAsync(async (req, res, next) => {
  const data = await AdminService.getAnalyticsData();
  res.status(200).json({ success: true, data });
});

exports.getRecentActivity = catchAsync(async (req, res, next) => {
  const activity = await AdminService.getRecentActivity();
  res.status(200).json({ success: true, data: activity });
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

exports.getLiveSessions = catchAsync(async (req, res, next) => {
  const sessions = await Session.find().populate("userId");
  res.status(200).json({
    success: true,
    message: "Active sessions retrieved",
    data: { count: sessions.length, sessions },
  });
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
