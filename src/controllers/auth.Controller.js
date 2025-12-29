const ActivationCode = require("../models/ActivationCode.model");
const Session = require("../models/Session.model");
const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/responseHandler"); // We might want to deprecate this in favor of straight res.json, but let's keep it for now if it formats things nicely. Actually, let's standardize on standard responses. The previous one used sendResponse(res, status, success, msg, data). I'll stick to that or better, plain json since I have global error handler.
// I'll stick to a standard response format manually or keep sendResponse if it's clean. Let's see sendResponse content? I didn't check it.
// I'll assume standard json response is better for clarity.
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const generateToken = (codeId, sessionId) => {
  return jwt.sign({ codeId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// @desc    User Login (Activate Code)
// @route   POST /api/auth/activate
exports.activateCode = catchAsync(async (req, res, next) => {
  const { code, deviceId } = req.body;

  // 1) Validate Input
  if (!code || !deviceId) {
    return next(new AppError("Please provide code and deviceId", 400));
  }

  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  // 2) Check if code exists
  const codeDoc = await ActivationCode.findOne({ code });
  if (!codeDoc) {
    return next(new AppError("Invalid Code", 404));
  }

  // 3) Check status
  if (codeDoc.status === "banned") {
    return next(new AppError("Code is Banned", 403));
  }
  if (codeDoc.status === "expired") {
    return next(new AppError("Code Expired", 403));
  }

  if (codeDoc.status === "active" && codeDoc.expiresAt < Date.now()) {
    codeDoc.status = "expired";
    await codeDoc.save();
    return next(new AppError("Code Expired", 403));
  }

  // 4) Manage Session
  const existingSession = await Session.findOne({ codeId: codeDoc._id });
  if (existingSession) {
    await Session.findByIdAndDelete(existingSession._id);
  }

  if (codeDoc.status === "unused") {
    codeDoc.status = "active";
    codeDoc.firstActivatedAt = Date.now();

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + codeDoc.durationDays);
    codeDoc.expiresAt = expiry;
    await codeDoc.save();
  }

  const newSession = await Session.create({
    codeId: codeDoc._id,
    ipAddress: ip,
    userAgent: userAgent,
    deviceId: deviceId,
  });

  const token = generateToken(codeDoc._id, newSession._id);

  res.status(200).json({
    success: true,
    message: "Activated Successfully",
    data: {
      token,
      expiresAt: codeDoc.expiresAt,
      daysLeft: Math.ceil(
        (codeDoc.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    },
  });
});

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = catchAsync(async (req, res, next) => {
  if (req.codeId) {
    await Session.findOneAndDelete({ codeId: req.codeId });
  }
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Validate Session (Heartbeat)
// @route   POST /api/auth/validate
exports.validateSession = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Session Valid",
  });
});
