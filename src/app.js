const express = require("express");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const { apiLimiter } = require("./middlewares/rateLimiters");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middlewares/error");
const logger = require("./utils/logger");

connectDB();

const app = express();

// Trust Proxy for Railway/Vercel
app.set("trust proxy", 1);

// 1. Global Middleware

// Set security HTTP headers
app.use(helmet());

// Implement CORS (Strict Whitelist)
const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",")
  : [process.env.FRONTEND_URL, "https://alsahasport-admin.vercel.app"];

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

// Logging Middleware (Morgan + Winston)
const morganFormat =
  process.env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser()); // Parsing cookies for Refresh Tokens

// Data Sanitization against NoSQL query injection
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    try {
      req.query = mongoSanitize.sanitize(req.query);
    } catch (err) {
      logger.warn(`Sanitization Warning: ${err.message}`);
    }
  }
  next();
});

// Prevent Parameter Pollution
app.use((req, res, next) => {
  try {
    hpp()(req, res, next);
  } catch (err) {
    logger.warn(`HPP Warning: ${err.message}`);
    next();
  }
});

// Global Rate Limiting (Applied to /api)
app.use("/api", apiLimiter);

// Output Sanitization (Security)
app.use(require("./middlewares/responseSanitizer"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
