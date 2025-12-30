const express = require("express");
const router = express.Router();

const { redeemCodeAtomic } = require("../controllers/redemption.Controller");
const {
  completeLogin,
  refreshToken,
  logout,
  validateSession,
} = require("../controllers/authController");

const { protect } = require("../middlewares/auth");
const { validateActivate } = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");

router.post(
  "/activate",
  authLimiter,
  validateActivate,
  redeemCodeAtomic,
  completeLogin
);
router.post("/refresh", refreshToken);
router.post("/validate", protect, validateSession);
router.post("/logout", protect, logout);

module.exports = router;
