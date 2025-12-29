const express = require("express");
const router = express.Router();
const { protectAdmin, restrictTo } = require("../middlewares/authMiddleware");
const {
  createCode,
  addChannel,
  getAllCodes,
  deleteCode,
  getLiveSessions,
  addProvider,
  loginAdmin,
} = require("../controllers/admin.Controller");

const {
  validateLogin,
  validateCreateCode,
  validateAddChannel,
} = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");

router.post("/login", authLimiter, validateLogin, loginAdmin);

router.use(protectAdmin);

router.post(
  "/codes",
  restrictTo("MASTER_ADMIN", "DAILY_ADMIN"),
  validateCreateCode,
  createCode
);
router.get("/codes", restrictTo("MASTER_ADMIN", "DAILY_ADMIN"), getAllCodes);
router.delete("/code/:id", restrictTo("MASTER_ADMIN"), deleteCode);

// Monitoring
router.get("/sessions/live", restrictTo("MASTER_ADMIN"), getLiveSessions);

// Content Management
router.post(
  "/channels",
  restrictTo("MASTER_ADMIN"),
  validateAddChannel,
  addChannel
);
router.post("/provider", restrictTo("MASTER_ADMIN"), addProvider);

module.exports = router;
