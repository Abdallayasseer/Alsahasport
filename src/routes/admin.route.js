const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middlewares/authMiddleware"); 
const {
  createCode,
  addChannel,
  getAllCodes,
  deleteCode,
  getLiveSessions,
  addProvider,
  loginAdmin,
} = require("../controllers/admin.Controller");

router.post("/login", loginAdmin);

router.use(protectAdmin);

router.post("/codes", createCode);
router.get("/codes", getAllCodes);
router.delete("/code/:id", deleteCode);

// Monitoring
router.get("/sessions/live", getLiveSessions);

// Content Management
router.post("/channels", addChannel);
router.post("/provider", addProvider);

module.exports = router;
