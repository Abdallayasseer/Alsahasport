const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");
const Session = require("../models/Session.model");
const sendResponse = require("../utils/responseHandler");

exports.protectAdmin = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      return sendResponse(res, 401, false, "Not authorized, token failed");
    }
  } else {
    return sendResponse(res, 401, false, "Not authorized, no token");
  }
};

exports.protectStream = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const activeSession = await Session.findOne({
        codeId: decoded.codeId,
        _id: decoded.sessionId,
      });

      if (!activeSession) {
        return sendResponse(
          res,
          401,
          false,
          "Session expired or active on another device"
        );
      }

      activeSession.lastActive = Date.now();
      await activeSession.save();

      req.codeId = decoded.codeId;
      next();
    } catch (error) {
      return sendResponse(res, 401, false, "Not authorized");
    }
  } else {
    return sendResponse(res, 401, false, "No token provided");
  }
};
