const AdminService = require("../services/admin.service");
const ActivationCode = require("../models/ActivationCode.model");
const Channel = require("../models/Channel.model");
const StreamProvider = require("../models/StreamProvider");
const Session = require("../models/Session.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Auth Helper
const { createSessionAndSend } = require("./authController");

exports.loginAdmin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  const admin = await AdminService.authenticate(username, password);

  await createSessionAndSend(
    admin,
    "admin-browser",
    req.ip,
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
  const { newCode, codeRaw, displayToken } = await AdminService.createCode(
    req.user._id,
    req.body
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
  const rawCode = await AdminService.revealCode(
    req.user._id,
    req.params.id,
    req.body.password
  );

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

exports.getRecentActivity = catchAsync(async (req, res, next) => {
  const activity = await AdminService.getRecentActivity();
  res.status(200).json({ success: true, data: activity });
});

exports.addChannel = catchAsync(async (req, res, next) => {
  const channel = await Channel.create(req.body);
  res.status(201).json({
    success: true,
    message: "Channel Added",
    data: channel,
  });
});

exports.addProvider = catchAsync(async (req, res, next) => {
  const provider = await StreamProvider.create(req.body);
  res.status(201).json({
    success: true,
    message: "Provider added",
    data: provider,
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
  const { password } = req.body;
  if (!password) {
    return next(
      new AppError("Master Admin password required for deletion", 400)
    );
  }
  await AdminService.deleteCode(req.user._id, req.params.id, password);
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
