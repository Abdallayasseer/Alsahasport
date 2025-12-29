const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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

require("dotenv").config();
connectDB();

const app = express();

// Global Middleware

// Set security HTTP headers
app.use(helmet());

// Implement CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data Sanitization against NoSQL query injection
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.headers) req.headers = mongoSanitize.sanitize(req.headers);
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query);
    if (req.query !== sanitizedQuery) {
      Object.defineProperty(req, "query", {
        value: sanitizedQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  next();
});

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global Rate Limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stream", streamRoutes);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
