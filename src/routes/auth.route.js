const express = require("express");
const router = express.Router();

const {
  activateCode,
  validateSession,
  logout,
} = require("../controllers/auth.Controller");

const { protectStreamOrAdmin } = require("../middlewares/authMiddleware");

router.post("/activate", activateCode);
router.post("/validate", protectStreamOrAdmin, validateSession);
router.post("/logout", protectStreamOrAdmin, logout);

module.exports = router;
