const express = require("express");
require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const { apiLimiter } = require("./middlewares/rateLimiters");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middlewares/error");
const logger = require("./utils/logger");

connectDB();

const app = express();

app.set("trust proxy", 1);

// ==========================================
// 1. CORS (MUST BE FIRST)
// ==========================================
const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",").map((url) => url.trim())
  : [process.env.FRONTEND_URL, "https://alsahasport-admin.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://alsahasport-admin.vercel.app",
        "https://alsahasport-production.up.railway.app",
        "http://localhost:5173",
        ...whitelist,
      ];

      // Remove duplicates
      const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];

      if (
        !origin ||
        uniqueOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-id",
    ],
  })
);

// Enable Pre-Flight for all routes
app.options("*", cors());

// ==========================================
// 2. Parsing Middlewares
// ==========================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// ==========================================
// 3. Security Middlewares
// ==========================================
const setupSecurity = require("./middlewares/security");
setupSecurity(app);

// app.use(require("./middlewares/responseSanitizer"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// 404 & Error Handler
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
