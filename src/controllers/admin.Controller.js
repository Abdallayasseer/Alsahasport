const ActivationCode = require("../models/ActivationCode.model");
const Channel = require("../models/Channel.model");
const crypto = require("crypto");
const StreamProvider = require("../models/StreamProvider");
const Session = require("../models/Session.model");
const Admin = require("../models/Admin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const generateAdminToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

exports.loginAdmin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError("Please provide username and password", 400));
  }

  const admin = await Admin.findOne({ username }).select("+password");

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return next(new AppError("Invalid username or password", 401));
  }

  const token = generateAdminToken(admin._id);
  admin.password = undefined;

  res.status(200).json({
    success: true,
    message: "Admin Logged in Successfully",
    data: {
      _id: admin._id,
      username: admin.username,
      role: admin.role,
      token: token,
    },
  });
});

exports.createCode = catchAsync(async (req, res, next) => {
  const { durationDays } = req.body; // 30, 90, 365

  if (!durationDays) {
    return next(new AppError("Please provide durationDays", 400));
  }

  const code = crypto.randomBytes(6).toString("hex").toUpperCase();

  const newCode = await ActivationCode.create({
    code,
    durationDays,
  });

  res.status(201).json({
    success: true,
    message: "Code Created",
    data: newCode,
  });
});

exports.addChannel = catchAsync(async (req, res, next) => {
  const channel = await Channel.create(req.body);
  res.status(201).json({
    success: true,
    message: "Channel Added",
    data: channel,
  });
});

// @desc
// @route   GET /api/admin/codes
exports.getAllCodes = catchAsync(async (req, res, next) => {
  const codes = await ActivationCode.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Codes retrieved",
    data: codes,
  });
});

// @desc
// @route   DELETE /api/admin/code/:id
exports.deleteCode = catchAsync(async (req, res, next) => {
  const code = await ActivationCode.findByIdAndDelete(req.params.id);
  if (!code) {
    return next(new AppError("No code found with that ID", 404));
  }

  await Session.findOneAndDelete({ codeId: req.params.id });

  res.status(200).json({
    success: true,
    message: "Code deleted successfully",
  });
});

// @desc    (Live)
// @route   GET /api/admin/sessions/live
exports.getLiveSessions = catchAsync(async (req, res, next) => {
  const sessions = await Session.find().populate("codeId", "code status");

  res.status(200).json({
    success: true,
    message: "Active sessions retrieved",
    data: {
      count: sessions.length,
      sessions,
    },
  });
});

// @desc
// @route   POST /api/admin/provider
exports.addProvider = catchAsync(async (req, res, next) => {
  const provider = await StreamProvider.create(req.body);
  res.status(201).json({
    success: true,
    message: "Provider added",
    data: provider,
  });
});
