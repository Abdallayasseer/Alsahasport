const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const Session = require("../models/Session.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.protectAdmin = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // Verification
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(new AppError("Invalid Token", 401));
      resolve(decoded);
    });
  });

  // Check if user still exists
  const currentAdmin = await Admin.findById(decoded.id);
  if (!currentAdmin) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // Grant Access
  req.admin = currentAdmin;
  next();
});

exports.protectStreamOrAdmin = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("No token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1) If it's an Admin
    if (decoded.id) {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.userType = "admin";
        req.admin = admin; // Attach admin for potential future use
        return next();
      }
    }

    // 2) If it's a User (Activation Code)
    if (decoded.codeId) {
      const activeSession = await Session.findOne({
        codeId: decoded.codeId,
        _id: decoded.sessionId,
      });

      if (!activeSession) {
        return next(
          new AppError("Session expired or active on another device", 401)
        );
      }

      // Update last active
      activeSession.lastActive = Date.now();
      await activeSession.save();

      req.codeId = decoded.codeId;
      req.userType = "user";
      return next();
    }
  } catch (err) {
    return next(new AppError("Invalid or Expired Token", 401));
  }

  return next(new AppError("Not authorized", 401));
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
