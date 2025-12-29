const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * SHA-256 Hash Helper
 * @param {string} token
 * @returns {string} hex hash
 */
exports.hashToken = (token) => {
  const secret = process.env.ACTIVATION_SECRET;
  if (!secret) throw new Error("Server Error: Missing ACTIVATION_SECRET");
  return crypto
    .createHash("sha256")
    .update(secret + token)
    .digest("hex");
};

/**
 * Generate Cryptographically Strong Refresh Token
 * @returns {string} 64-char hex string
 */
exports.generateRefreshToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Sign JWT Access Token
 * @param {Object} payload
 * @returns {string} JWT
 */
exports.signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m", // Short lived
  });
};

/**
 * Verify JWT
 * @param {string} token
 * @returns {Promise<Object>} decoded payload
 */
exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};
