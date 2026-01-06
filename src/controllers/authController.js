const AuthService = require("../services/auth.service");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { getRealIp } = require("../utils/ipUtils");
const { decryptCode } = require("../utils/encryption");
const { analyzeIpConfidence } = require("../utils/ipDetection");

const {
  refreshSchema,
  loginSchema,
} = require("../validations/auth.validation");

const createSessionAndSend = async (
  user,
  deviceId,
  ipData, // Changed from 'ip' to 'ipData' object or handled internally
  userAgent,
  res,
  role = "user"
) => {
  // ipData can be { clientPublicIp, proxyDetectedIp, ipConfidence, bestIp }
  const { accessToken, refreshToken, expiresAt, session } =
    await AuthService.createSession(
      user,
      role,
      deviceId,
      ipData.bestIp,
      userAgent,
      ipData
    );

  // Send Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "Strict",
  });

  // Handle Client/User Login Response (Provider Handoff)
  if (role === "user") {
    let rawCode = "";
    if (user.codeEncrypted) {
      try {
        rawCode = decryptCode(user.codeEncrypted);
      } catch (e) {
        require("../utils/logger").error(
          "Failed to decrypt code for login response"
        );
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        subscription: {
          status: "Active",
          host_url: process.env.PROVIDER_API_URL,
          username: rawCode,
          password: rawCode,
        },
      },
    });
  }

  res.status(200).json({
    status: "success",
    accessToken,
    expiresAt,
    data: {
      id: user._id,
      username: user.username,
      role,
      sessionId: session._id,
    },
  });
};

exports.createSessionAndSend = createSessionAndSend;

exports.completeLogin = catchAsync(async (req, res, next) => {
  // req.redeemedUser is set by 'redeemCodeAtomic' middleware
  const user = req.redeemedUser;
  if (!user) {
    return next(new AppError("User not identified via redemption", 401));
  }

  // Validate Input
  const { deviceId, clientPublicIp } = loginSchema.parse(req.body);

  const proxyIp = getRealIp(req);
  const ipData = analyzeIpConfidence(clientPublicIp, proxyIp);

  await createSessionAndSend(
    user,
    deviceId,
    ipData,
    req.headers["user-agent"],
    res,
    "user"
  );
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  // Defensive check: Ensure req.body exists
  if (!req.body) req.body = {};

  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return next(new AppError("No refresh token provided", 400));
  }

  // Zod Validate
  try {
    refreshSchema.parse({ refreshToken: token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(err.errors[0].message, 400));
    }
    return next(err);
  }

  let result;
  try {
    result = await AuthService.refreshToken(token);
  } catch (err) {
    // Critical: Clear cookies if refresh fails to stop the frontend loop
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    return next(new AppError("Refresh failed: " + err.message, 401));
  }

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
