const express = require("express");
const router = express.Router();
const { 
  createCode, 
  addChannel, 
  getAllCodes,     
  deleteCode,      
  getLiveSessions, 
  addProvider,     
  loginAdmin 
} = require('../controllers/admin.Controller');

// Codes Management
router.post('/codes', createCode);
router.get('/codes', getAllCodes);         
router.delete('/code/:id', deleteCode);    

// Monitoring
router.get('/sessions/live', getLiveSessions)

// Content Management
router.post('/channels', addChannel);
router.post('/provider', addProvider);     
const { protectAdmin } = require("../middlewares/authMiddleware");

router.post("/login", loginAdmin);

router.use(protectAdmin);


// router.get('/codes', getAllCodes);
// router.delete('/codes/:id', deleteCode);
// router.get('/online-users', getOnlineUsers);

module.exports = router;
