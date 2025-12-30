const express = require("express");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const { apiLimiter } = require("./middlewares/rateLimiters");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const streamRoutes = require("./routes/stream.route");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middlewares/error");
const logger = require("./utils/logger");

connectDB();

const app = express();

// 1. Global Middleware

// Set security HTTP headers
app.use(helmet());

// Implement CORS (Strict Whitelist)
const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",")
  : [process.env.FRONTEND_URL];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      whitelist.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// Compression
app.use(compression());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser()); // Parsing cookies for Refresh Tokens

// Data Sanitization against NoSQL query injection
// Manual sanitization to avoid Express 5 compatibility issues with express-mongo-sanitize
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    try {
      req.query = mongoSanitize.sanitize(req.query);
    } catch (err) {
      // In some Express 5 environments, req.query might be read-only or a getter
      // We log the warning but don't crash.
      console.warn("Warning: Could not sanitize req.query:", err.message);
    }
  }
  next();
});

// Data Sanitization against XSS
// Manual wrapper for xss-clean to handle Express 5 req.query issues
app.use((req, res, next) => {
  try {
    xss()(req, res, next);
  } catch (err) {
    console.warn(
      "Warning: xss-clean failed (likely req.query read-only):",
      err.message
    );
    next();
  }
});

// Prevent Parameter Pollution
// Manual wrapper for hpp to handle Express 5 req.query issues
app.use((req, res, next) => {
  try {
    hpp()(req, res, next);
  } catch (err) {
    console.warn(
      "Warning: hpp failed (likely req.query read-only):",
      err.message
    );
    next();
  }
});

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // Use custom logger stream for Morgan in production if desired, or just rely on Winston
}

// Global Rate Limiting (Applied to /api)
// Note: Auth routes usually have stricter limits applied in their router/controller
app.use("/api", apiLimiter);

// Output Sanitization (Security) - Keeping existing if useful
app.use(require("./middlewares/responseSanitizer"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stream", streamRoutes);

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
