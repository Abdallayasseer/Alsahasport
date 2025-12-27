const ActivationCode = require("../models/ActivationCode.model");
const Channel = require("../models/Channel.model");
const crypto = require("crypto");
const sendResponse = require("../utils/responseHandler");
const StreamProvider = require("../models/StreamProvider");
const Session = require("../models/Session.model");

const Admin = require('../models/Admin.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateAdminToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return sendResponse(res, 401, false, "Invalid username or password");
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return sendResponse(res, 401, false, "Invalid username or password");
    }

    const token = generateAdminToken(admin._id);

    sendResponse(res, 200, true, "Admin Logged in Successfully", {
      _id: admin._id,
      username: admin.username,
      role: admin.role,
      token,
    });
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};


exports.createCode = async (req, res) => {
  const { durationDays } = req.body; // 30, 90, 365

  const code = crypto.randomBytes(6).toString("hex").toUpperCase();

  try {
    const newCode = await ActivationCode.create({
      code,
      durationDays,
    });
    sendResponse(res, 201, true, "Code Created", newCode);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

exports.addChannel = async (req, res) => {
  try {
    const channel = await Channel.create(req.body);
    sendResponse(res, 201, true, "Channel Added", channel);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};


// @desc    
// @route   GET /api/admin/codes
exports.getAllCodes = async (req, res) => {
  try {
    const codes = await ActivationCode.find().sort({ createdAt: -1 });
    sendResponse(res, 200, true, "Codes retrieved", codes);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

// @desc    
// @route   DELETE /api/admin/code/:id
exports.deleteCode = async (req, res) => {
  try {
    await ActivationCode.findByIdAndDelete(req.params.id);
    await Session.findOneAndDelete({ codeId: req.params.id });

    sendResponse(res, 200, true, "Code deleted successfully");
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

// @desc    (Live)
// @route   GET /api/admin/sessions/live
exports.getLiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find().populate("codeId", "code status");

    sendResponse(res, 200, true, "Active sessions retrieved", {
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

// @desc  
// @route   POST /api/admin/provider
exports.addProvider = async (req, res) => {
  try {
    const provider = await StreamProvider.create(req.body);
    sendResponse(res, 201, true, "Provider added", provider);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};