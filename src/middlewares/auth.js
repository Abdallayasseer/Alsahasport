const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const Session = require("../models/Session.model");
const Admin = require("../models/Admin.model");
const ActivationCode = require("../models/ActivationCode.model");

const protect = catchAsync(async (req, res, next) => {
  // 1) Get token
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

  // 2) Verify Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check Session in DB (Stateful)
  // We include sessionId in the JWT payload to link it to the DB session
  const session = await Session.findById(decoded.sessionId);

  if (!session || session.isRevoked) {
    return next(new AppError("Session is invalid or has been revoked.", 401));
  }

  if (session.expiresAt < Date.now()) {
    return next(new AppError("Session has expired.", 401));
  }

  // 4) Check if User still exists
  let currentUser;
  if (
    decoded.role === "admin" ||
    decoded.role === "MASTER_ADMIN" ||
    decoded.role === "DAILY_ADMIN"
  ) {
    // Adjust roles as needed
    // Admin roles usually stored in 'role' but decoded might just say 'admin' or specific role.
    // In AuthService we stored 'role' from input.
    currentUser = await Admin.findById(decoded.userId);
  } else {
    currentUser = await ActivationCode.findById(decoded.userId);
  }

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 5) Check if user changed password after token was issued (Optional/Advanced)
  // if (currentUser.changedPasswordAfter(decoded.iat)) ...

  // GRANT ACCESS
  req.user = currentUser;
  req.session = session;
  next();
});

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user.role might be "DAILY_ADMIN"
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
