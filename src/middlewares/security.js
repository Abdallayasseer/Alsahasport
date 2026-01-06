const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const setupSecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Global Rate Limiting - General (Allow 100 requests from the same IP per 10 minutes)
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message:
      "Too many requests from this IP, please try again after 10 minutes",
  });

  // Apply the rate limiting middleware to all requests
  app.use("/api", limiter);
};

module.exports = setupSecurity;
