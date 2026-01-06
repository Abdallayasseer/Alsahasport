const express = require("express");
require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const AppError = require("./utils/AppError");

// Production Optimization: Remove console.logs
if (process.env.NODE_ENV === "production") {
  console.log = function () {};
  console.warn = function () {};
  console.error = function () {};
}

const app = express();

// 1. Connect Database
connectDB();

app.set("trust proxy", 1);

// 2. Security Middlewares (The Fortress)
app.use(helmet()); // Set secure HTTP headers

// 3. CORS
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
      if (
        !origin ||
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
  })
);
app.options(/(.*)/, cors());

// 4. Essential Parsing & Sanitization
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// 6. Emergency Error Handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error("CRITICAL ERROR ");
    console.error(err.stack);
  }

  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 Handler
app.all(/(.*)/, (req, res, next) => {
  res
    .status(404)
    .json({ status: "fail", message: `Route ${req.originalUrl} not found` });
});

module.exports = app;
