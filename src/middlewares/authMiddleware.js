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

  // 3) Check if user exists & Role Logic
  // The token payload contains { userId, sessionId, role }

  if (decoded.role === "user") {
    // 4) Check Session Validity (Critical for Users)
    // Must hit DB to ensure session is not revoked
    const session = await Session.findById(decoded.sessionId);

    if (!session) {
      return next(new AppError("Session expired or invalid", 401));
    }

    if (session.isRevoked) {
      return next(new AppError("Session has been revoked", 401));
    }

    // Check manual expiry if needed, though Mongo TTL might handle it
    if (session.expiresAt < Date.now()) {
      return next(new AppError("Session expired", 401));
    }

    // Update Last Active (Async, don't await if performance critical, but good for tracking)
    session.lastActive = Date.now();
    session.save({ validateBeforeSave: false });

    req.user = {
      _id: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
      deviceId: session.deviceId,
    };
  } else {
    // Admin Logic (Sessionless or separate admin session logic)
    // For now, assume Admins use standard JWTs without session binding or we bind them too.
    // Instructions implied "Session" model stores `userId` (Users).
    // If Admins need sessions, we'd act similarly.
    // Current Admin system is stateless. I will keep it stateless unless asked,
    // BUT I must ensure `req.user` is set correctly.

    const admin = await Admin.findById(decoded.id || decoded.userId);
    if (!admin) {
      return next(new AppError("Admin no longer exists", 401));
    }
    // Check password changed? (omitted for brevity unless standard)
    req.user = admin; // Admin model has .role
  }

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
