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

router.post("/login", loginAdmin);

router.use(protectAdmin);

router.post("/codes", restrictTo('MASTER_ADMIN','DAILY_ADMIN'), createCode);
router.get("/codes", restrictTo('MASTER_ADMIN','DAILY_ADMIN'), getAllCodes);
router.delete("/code/:id", restrictTo('MASTER_ADMIN'), deleteCode);

// Monitoring
router.get("/sessions/live", restrictTo('MASTER_ADMIN'), getLiveSessions);

// Content Management
router.post("/channels", restrictTo('MASTER_ADMIN'), addChannel);
router.post("/provider", restrictTo('MASTER_ADMIN'), addProvider);

module.exports = router;
