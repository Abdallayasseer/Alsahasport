const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("./middlewares/mongoSanitize");

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
// Allow all for now, but in production this should be restricted
app.use(
  cors({
    origin: "*", // Adjust this to specific domains in production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stream", streamRoutes);

// Handle Unhandled Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
