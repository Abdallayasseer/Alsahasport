const rateLimit = require("express-rate-limit");

exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per hour
  message: "Too many login/activation attempts, please try again after an hour",
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  message: "Too many requests from this IP, please try again later",
});
