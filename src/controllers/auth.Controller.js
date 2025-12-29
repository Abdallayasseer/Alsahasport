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
const createSessionAndSend = async (user, deviceId, ip, userAgent, res) => {
  // 1. Generate Tokens
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  // 2. Create Session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  const newSession = await Session.create({
    userId: user._id,
    refreshTokenHash,
    deviceId,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  // 3. Convert to Access Token
  const accessToken = signAccessToken({
    userId: user._id,
    sessionId: newSession._id,
    role: "user",
  });

  // 4. Send Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "Strict",
  });

  // 5. Response
  res.status(200).json({
    status: "success",
    accessToken,
    expiresAt: user.expiresAt, // subscription expiry
    user: {
      id: user._id,
      role: "user",
    },
  });
};

// Uses 'redemption.Controller' middleware to find/validate user first, then:
exports.completeLogin = catchAsync(async (req, res, next) => {
  // req.redeemedUser is set by previous middleware (redeemCodeAtomic)
  const user = req.redeemedUser;
  const { deviceId } = req.body;

  await createSessionAndSend(
    user,
    deviceId,
    req.ip,
    req.headers["user-agent"],
    res
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
  if (session.isRevoked || session.expiresAt < Date.now()) {
    return next(new AppError("Session expired", 401));
  }

  // 3. User Check
  // const user = await ActivationCode.findById(session.userId);
  // if (!user) ...

  // 4. ROTATION
  // Invalidate OLD hash (effectively "consuming" the token)
  // Create NEW hash
  const newRefreshToken = generateRefreshToken();
  const newHash = hashToken(newRefreshToken);

  session.refreshTokenHash = newHash;
  session.lastActive = Date.now();
  // Extend session life? Or keep original login window?
  // Usually extend on activity -> Sliding Window
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await session.save();

  // 5. Issue New Access Token
  const newAccessToken = signAccessToken({
    userId: session.userId,
    sessionId: session._id,
    role: "user",
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
