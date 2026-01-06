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

// Implement CORS (Strict Whitelist)
const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",")
  : [process.env.FRONTEND_URL, "https://alsahasport-admin.vercel.app"];

const corsOptions = {
  origin: function (origin, callback) {
    // Explicitly allow Vercel Frontend and Railway requests
    const allowedOrigins = [
      "https://alsahasport-admin.vercel.app",
      "https://alsahasport-production.up.railway.app",
    ];

    if (
      !origin ||
      whitelist.indexOf(origin) !== -1 ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

// 1. Parsing Middleware (TOP PRIORITY for mongo-sanitize)
// Must parse body BEFORE security middleware attempts to sanitize it
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 2. Global Middleware (CORS, Compression, Logging)
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(compression());

// Logging Middleware
const morganFormat =
  process.env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// 3. Security (Helmet, XSS, MongoSanitize, HPP, Rate Limit)
// IMPORTANT: This must run AFTER body parsers
const setupSecurity = require("./middlewares/security");
setupSecurity(app);

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
