const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const {
  createCode,
  getAllCodes,
  deleteCode,
  loginAdmin,
  displayCode,
  revealCode,
  getDashboardData,
  getSystemStatus,
  getLiveSessions,
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

router.get(
  "/sessions/live",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  getLiveSessions
);

// Dashboard Stats
// Consolidated Dashboard Endpoint
router.get(
  "/stats",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  getDashboardData
);

// System Status
router.get("/system/status", getSystemStatus);

module.exports = router;
