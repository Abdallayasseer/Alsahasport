const { z } = require("zod");
const AuthService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Zod Schemas
const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Since completeLogin receives data from middleware, validation might be handled there or here for body params like 'deviceId'
const loginSchema = z.object({
  deviceId: z.string().optional(),
});

exports.completeLogin = catchAsync(async (req, res, next) => {
  // req.redeemedUser is set by 'redeemCodeAtomic' middleware
  const user = req.redeemedUser;
  if (!user) {
    return next(new AppError("User not identified via redemption", 401));
  }

  // Validate Input
  const { deviceId } = loginSchema.parse(req.body);

  const { accessToken, refreshToken, expiresAt, session } =
    await AuthService.createSession(
      user,
      "user",
      deviceId,
      req.ip,
      req.headers["user-agent"]
    );

  // Send Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "Strict",
  });

  res.status(200).json({
    status: "success",
    accessToken,
    expiresAt: user.expiresAt, // Subscription expiry
    data: {
      id: user._id,
      username: user.username, // Assuming 'codeHash' or similar if username not persistent
      role: "user",
      sessionId: session._id,
    },
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  // Zod Validate
  try {
    refreshSchema.parse({ refreshToken: token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    return next(err);
  }

  const result = await AuthService.refreshToken(token);

  // Send new Cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: result.expiresAt,
    sameSite: "Strict",
  });

  res.status(200).json({
    status: "success",
    accessToken: result.accessToken,
    data: {
      role: result.session.role,
      sessionId: result.session._id,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  if (req.user && req.session) {
    await AuthService.revokeSession(req.session._id);
  }

  res.cookie("refreshToken", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
});

exports.logoutAll = catchAsync(async (req, res, next) => {
  await AuthService.revokeAllSessions(req.user._id);
  res
    .status(200)
    .json({ status: "success", message: "All devices logged out" });
});

exports.validateSession = catchAsync(async (req, res, next) => {
  // If request reached here, 'protect' middleware already validated it
  res.status(200).json({
    success: true,
    message: "Session Valid",
    data: {
      userId: req.user._id,
      sessionId: req.session ? req.session._id : req.user.sessionId,
      role: req.user.role, // 'user' or 'admin'...
    },
  });
});
