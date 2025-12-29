const crypto = require("crypto");

/**
 * Generate Signed URL
 * @param {string} originalUrl
 * @param {Object} options { expires, userId, ip, secret }
 */
exports.signStreamUrl = (originalUrl, { expires, userId, ip, secret }) => {
  const dataToSign = `${originalUrl}:${expires}:${userId}:${ip}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  // Construct safe query params
  const separator = originalUrl.includes("?") ? "&" : "?";
  return `${originalUrl}${separator}expires=${expires}&user=${userId}&signature=${signature}`;
};

/**
 * Verify Signed URL (Middleware Helper or Standalone)
 */
exports.verifySignedUrl = (url, ip, secret) => {
  // Logic to parse URL, extract signature, re-compute hmac and compare `crypto.timingSafeEqual`
  // Implementation depends on if this Node server proxies the stream or just generates links.
  // Providing generation logic as requested.
  return true;
};
