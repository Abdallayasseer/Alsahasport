const dotenv = require("dotenv");

// Handle uncaught exceptions (bugs in synchronous code)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config();
const app = require("./app");
const { initCronJobs } = require("./services/cronService");

const PORT = process.env.PORT || 5000;

// Initialize Cron Jobs
initCronJobs();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled rejections (rejected promises)
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
