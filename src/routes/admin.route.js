const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const {
  createCode,
  getAllCodes,
  deleteCode,
  getLiveSessions,
  loginAdmin,
  displayCode,
  revealCode,
  getDashboardStats,
  getWeeklyCodeStats,
  getRecentActivity,
  getSystemStatus,
} = require("../controllers/admin.Controller");

const {
  validateLogin,
  validateCreateCode,

  validateRevealCode,
} = require("../validators/admin.validator");
const { authLimiter } = require("../middlewares/rateLimiters");

router.post("/login", authLimiter, validateLogin, loginAdmin);

// Verification Endpoint (Protected)
const { verifyMasterPassword } = require("../controllers/admin.Controller");
router.post(
  "/verify-master-password",
  protect,
  restrictTo("MASTER_ADMIN"),
  verifyMasterPassword
);

router.use(protect);

router.post(
  "/codes",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  validateCreateCode,
  createCode
);
router.get(
  "/code/:id/display",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  displayCode
);
router.post(
  "/codes/:id/reveal",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  validateRevealCode,
  revealCode
);
router.get("/codes", restrictTo("MASTER_ADMIN", "DAILY_ADMIN"), getAllCodes);
router.delete("/codes/:id", restrictTo("MASTER_ADMIN"), deleteCode);

// Monitoring
router.get("/sessions/live", restrictTo("MASTER_ADMIN"), getLiveSessions);

// Dashboard Stats
router.get(
  "/stats",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  getDashboardStats
);
router.get(
  "/stats/weekly",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  getWeeklyCodeStats
);
router.get(
  "/activity",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  getRecentActivity
);

router.get(
  "/analytics",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  require("../controllers/admin.Controller").getAnalyticsData
);

// System Status
router.get("/system/status", getSystemStatus);

// Content Management

module.exports = router;
