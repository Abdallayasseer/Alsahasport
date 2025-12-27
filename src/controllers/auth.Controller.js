const ActivationCode = require("../models/ActivationCode.model"); 
const Session = require("../models/Session.model"); 
const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/responseHandler");

const generateToken = (codeId, sessionId) => {
  return jwt.sign({ codeId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// @desc    User Login (Activate Code)
// @route   POST /api/auth/activate
exports.activateCode = async (req, res) => {
  const { code, deviceId } = req.body;
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const codeDoc = await ActivationCode.findOne({ code });
    if (!codeDoc) return sendResponse(res, 404, false, "Invalid Code");

    if (codeDoc.status === "banned")
      return sendResponse(res, 403, false, "Code is Banned");
    if (codeDoc.status === "expired")
      return sendResponse(res, 403, false, "Code Expired");

    if (codeDoc.status === "active" && codeDoc.expiresAt < Date.now()) {
      codeDoc.status = "expired";
      await codeDoc.save();
      return sendResponse(res, 403, false, "Code Expired");
    }

    const existingSession = await Session.findOne({ codeId: codeDoc._id });
    if (existingSession) {
      await Session.findByIdAndDelete(existingSession._id);
    }

    if (codeDoc.status === "unused") {
      codeDoc.status = "active";
      codeDoc.firstActivatedAt = Date.now();

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + codeDoc.durationDays);
      codeDoc.expiresAt = expiry;
      await codeDoc.save();
    }

    const newSession = await Session.create({
      codeId: codeDoc._id,
      ipAddress: ip,
      userAgent: userAgent,
      deviceId: deviceId,
    });

    const token = generateToken(codeDoc._id, newSession._id);

    sendResponse(res, 200, true, "Activated Successfully", {
      token,
      expiresAt: codeDoc.expiresAt,
      daysLeft: Math.ceil(
        (codeDoc.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    });
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.codeId) {
      await Session.findOneAndDelete({ codeId: req.codeId });
    }
    sendResponse(res, 200, true, "Logged out successfully");
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

// @desc    Validate Session (Heartbeat)
// @route   POST /api/auth/validate
exports.validateSession = async (req, res) => {
  sendResponse(res, 200, true, "Session Valid");
};
