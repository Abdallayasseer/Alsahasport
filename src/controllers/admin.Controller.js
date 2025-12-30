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

const generateAdminToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
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

  // Use the Shared Auth Logic to create session
  // Note: Admin Controller needs access to createSessionAndSend.
  // We can require it or move logic. Requiring from another controller is circular but
  // standard pattern is "AuthService". Here simpler to just import.
  const { createSessionAndSend } = require("./authController");

  await createSessionAndSend(
    admin,
    "admin-browser", // Device ID (Should be from req.body or headers if available)
    req.ip,
    req.headers["user-agent"],
    res,
    admin.role // Pass the specific admin role (MASTER_ADMIN etc)
  );
});

const { encryptCode, decryptCode } = require("../utils/encryption");

exports.createCode = catchAsync(async (req, res, next) => {
  const { durationDays, maxDevices } = req.body;

  if (!durationDays) {
    return next(new AppError("Please provide durationDays", 400));
  }

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
    createdBy: req.user._id,
  });

  // Create Display Token (Encrypted Raw Code)
  const encryptedRaw = encryptCode(codeRaw);

  const displayToken = jwt.sign(
    { id: newCode._id, data: encryptedRaw, type: "display_token" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  res.status(201).json({
    success: true,
    message: "Code Created",
    data: {
      id: newCode._id,
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
  const { token } = req.query; // GET request, token in Query

  if (!token) return next(new AppError("Display Token required", 400));

  // 1. Verify Token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(new AppError("Display Token Expired", 410));
    return next(new AppError("Invalid Token", 401));
  }

  if (decoded.type !== "display_token")
    return next(new AppError("Invalid Token Type", 400));

  // 2. Match Token ID with Route ID
  if (decoded.id !== id)
    return next(new AppError("Token mismatch for this Code ID", 400));

  // 3. Check DB State
  const codeDoc = await ActivationCode.findById(id);
  if (!codeDoc) return next(new AppError("Code not found", 404));

  if (codeDoc.viewed) {
    return next(
      new AppError("Code already displayed. Cannot be viewed again.", 410)
    );
  }

  // 4. Mark Viewing
  codeDoc.viewed = true;
  await codeDoc.save();

  // 5. Decrypt
  let rawCode;
  try {
    rawCode = decryptCode(decoded.data);
  } catch (e) {
    return next(new AppError("Decryption Failed", 500));
  }

  res.status(200).json({
    success: true,
    data: {
      id: codeDoc._id,
      code: rawCode,
    },
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
  const sessions = await Session.find().populate("userId");

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
