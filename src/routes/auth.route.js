const express = require("express");
const router = express.Router();

const {
  activateCode,
  validateSession,
  logout,
} = require("../controllers/auth.Controller");

const { protectStreamOrAdmin } = require("../middlewares/authMiddleware");

const { validateActivate } = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiters");

router.post("/activate", authLimiter, validateActivate, activateCode);
router.post("/validate", protectStreamOrAdmin, validateSession);
router.post("/logout", protectStreamOrAdmin, logout);

module.exports = router;
