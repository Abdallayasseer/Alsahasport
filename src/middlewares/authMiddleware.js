const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { verifyToken } = require("../utils/tokenManager");
const Session = require("../models/Session.model");
const Admin = require("../models/Admin.model");

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get Token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authenticated", 401));
  }

  // 2) Verify JWT
  const decoded = await verifyToken(token);

  // 3) Check Session Validity (Unified for User & Admin)
  const session = await Session.findById(decoded.sessionId);

  if (!session) {
    console.log("Auth Fail: Session not found", decoded.sessionId);
    return next(new AppError("Session expired or invalid", 401));
  }

  if (session.isRevoked) {
    console.log("Auth Fail: Session revoked");
    return next(new AppError("Session has been revoked", 401));
  }

  // Check Expiry (Double check)
  if (session.expiresAt < Date.now()) {
    return next(new AppError("Session expired", 401));
  }

  // 4) Fetch User based on Role/Model
  let user;
  if (session.role === "user") {
    user = await require("../models/ActivationCode.model").findById(
      session.userId
    );
  } else {
    user = await Admin.findById(session.userId);
  }

  if (!user) {
    return next(new AppError("User/Admin no longer exists", 401));
  }

  // Update Last Active (Async)
  session.lastActive = Date.now();
  session.save({ validateBeforeSave: false });

  req.user = user;
  req.user.role = session.role; // Ensure role is from legitimate session
  req.user.sessionId = session._id;
  req.user.deviceId = session.deviceId;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Permission denied", 403));
    }
    next();
  };
};
