const Session = require("../models/Session.model");
const ActivationCode = require("../models/ActivationCode.model"); // User Model
const {
  hashToken,
  generateRefreshToken,
  signAccessToken,
} = require("../utils/tokenManager");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Helper to Create & Send Tokens
exports.createSessionAndSend = async (
  user,
  deviceId,
  ip,
  userAgent,
  res,
  role = "user"
) => {
  // 1. Check & Enforce Single Session for ADMINS
  if (role !== "user") {
    // Find existing active sessions and revoke them (or just delete)
    await Session.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true }
    );
  }

  // 2. Generate Tokens
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  // 3. Create Session
  // Admin: 24h, User: 7 Days (or 14 days as per request "Refresh Token lifetime = 14 days")
  // Request says "Refresh Token lifetime = 14 days". Let's stick to 14 days for user.
  // "auto-expire admin sessions after 24h"
  const sessionLife =
    role === "user" ? 14 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + sessionLife);

  const newSession = await Session.create({
    userId: user._id,
    userModel: role === "user" ? "ActivationCode" : "Admin",
    role: role,
    refreshTokenHash,
    deviceId: deviceId || "unknown",
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  // 4. Convert to Access Token
  const accessToken = signAccessToken({
    userId: user._id,
    sessionId: newSession._id,
    role: role,
  });

  // 5. Send Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "Strict",
  });

  // 6. Response
  res.status(200).json({
    status: "success",
    accessToken,
    expiresAt: role === "user" ? user.expiresAt : undefined, // subscription expiry
    data: {
      id: user._id,
      username: user.username,
      role: role,
      sessionId: newSession._id,
    },
  });
};

// Uses 'redemption.Controller' middleware to find/validate user first, then:
exports.completeLogin = catchAsync(async (req, res, next) => {
  // req.redeemedUser is set by previous middleware (redeemCodeAtomic)
  const user = req.redeemedUser;
  const { deviceId } = req.body;

  await exports.createSessionAndSend(
    user,
    deviceId,
    req.ip,
    req.headers["user-agent"],
    res,
    "user"
  );
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies; // Or body

  if (!refreshToken) {
    return next(new AppError("No token provided", 401));
  }

  const hashedToken = hashToken(refreshToken);

  // 1. Find Session by Hash
  const session = await Session.findOne({
    refreshTokenHash: hashedToken,
  }).select("+refreshTokenHash");

  if (!session) {
    // DETECT REPLAY OF OLD TOKEN?
    // If we can't find it, it might be rotated already.
    // Advanced: Store "Family ID" to track reuse.
    // Simple: Just fail.
    return next(new AppError("Invalid Token", 401));
  }

  // 2. Check Validity
  if (session.isRevoked) {
    return next(new AppError("Session revoked", 401));
  }
  if (session.expiresAt < Date.now()) {
    return next(new AppError("Session expired", 401));
  }

  // 3. User Check (Standardized)
  let user;
  if (session.role === "user") {
    user = await ActivationCode.findById(session.userId);
  } else {
    user = await require("../models/Admin.model").findById(session.userId);
  }
  // If user deleted but session remains?
  if (!user) {
    return next(new AppError("User not found", 401));
  }

  // 4. ROTATION
  // Invalidate OLD hash (effectively "consuming" the token)
  // Create NEW hash
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);

  session.refreshTokenHash = newHash;
  session.lastActive = Date.now();

  // Extend session life? Not for Admins (Fixed 24h usually? Or sliding?)
  // Prompt says "auto-expire admin sessions after 24h", usually implies absolute max?
  // User says "Require refresh cycle to maintain session security", implying sliding window is fine OR strict rotation.
  // We'll slide for User, maybe strict for Admin?
  // Let's slide both for now to avoid UX issues unless strict max requested.
  // "Access Token lifetime = 15 minutes", "Refresh Token lifetime = 14 days".

  // Re-calculate expiry
  const sessionLife =
    session.role === "user" ? 14 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  session.expiresAt = new Date(Date.now() + sessionLife);

  await session.save();

  // 5. Issue New Access Token
  const newAccessToken = signAccessToken({
    userId: session.userId,
    sessionId: session._id,
    role: session.role || "user",
  });

  // 6. Send
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    sameSite: "Strict",
  });

  res.status(200).json({
    status: "success",
    accessToken: newAccessToken,
    data: {
      role: session.role,
      sessionId: session._id,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  // Revoke current session
  if (req.user && req.user.sessionId) {
    await Session.findByIdAndUpdate(req.user.sessionId, { isRevoked: true });
  }

  res.cookie("refreshToken", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
});

exports.logoutAll = catchAsync(async (req, res, next) => {
  await Session.updateMany(
    { userId: req.user._id, isRevoked: false },
    { isRevoked: true }
  );
  res
    .status(200)
    .json({ status: "success", message: "All devices logged out" });
});

// Legacy/Compatibility exports if needed
// Legacy/Compatibility exports if needed
exports.activateCode = exports.completeLogin; // Placeholder, Route will chain middleware

exports.validateSession = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Session Valid",
    data: {
      userId: req.user._id,
      sessionId: req.user.sessionId,
      role: req.user.role,
    },
  });
});
