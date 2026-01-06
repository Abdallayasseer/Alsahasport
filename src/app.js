const express = require("express");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
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

// ==================================================
// Parsing Middlewares 
// ==================================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 3. إعدادات الـ CORS
const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",")
  : [process.env.FRONTEND_URL, "https://alsahasport-admin.vercel.app"];

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://alsahasport-admin.vercel.app",
      "https://alsahasport-production.up.railway.app",
      "http://localhost:5173", 
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

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use(compression());

// Logging
const morganFormat =
  process.env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// ==================================================
// ( express.json)
// ==================================================
const setupSecurity = require("./middlewares/security");
setupSecurity(app);

// Output Sanitization
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
