const rateLimit = require("express-rate-limit");

exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 login requests per hour
  message: "Too many login/activation attempts, please try again after an hour",
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 mins
  message: "Too many requests from this IP, please try again later",
});

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes window
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
});

exports.refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Strict limit on refresh tokens to prevent abuse
  message: "Too many refresh attempts, please try again later",
});
