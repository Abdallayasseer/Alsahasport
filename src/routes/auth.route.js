const express = require("express");
const router = express.Router();
const {
  activateCode,
  validateSession,
  logout
} = require("../controllers/auth.Controller");
const { protectStream } = require("../middlewares/authMiddleware");



router.post('/validate', protectStream, validateSession);
router.post('/logout', protectStream, logout); 

router.post("/activate", activateCode);
router.post("/validate", protectStream, validateSession);

module.exports = router;
