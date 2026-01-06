const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const setupSecurity = (app) => {
  // 1. HTTP Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // 2. Mongo Injection Protection
  app.use(mongoSanitize());

  // 3. XSS Protection
  app.use(xss());

  // 4. Parameter Pollution
  app.use(hpp());

  // 5. Rate Limiting
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 150,
    message:
      "Too many requests from this IP, please try again after 10 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", limiter);
};

module.exports = setupSecurity;
