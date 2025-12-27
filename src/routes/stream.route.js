const express = require("express");
const router = express.Router();

const {
  getChannels,
  getCategories,
  getChannelStream,
} = require("../controllers/stream.Controller");
const { protectStreamOrAdmin } = require('../middlewares/authMiddleware');
router.use(protectStreamOrAdmin); 

router.get("/channels", getChannels); 
router.get("/categories", getCategories); 
router.get("/channel/:id", getChannelStream); 

module.exports = router;
