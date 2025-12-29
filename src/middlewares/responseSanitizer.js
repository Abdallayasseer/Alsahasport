const sanitize = (data, allowCode) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, allowCode));
  }

  if (typeof data === "object" && data !== null) {
    // Check if it's a Date or special object type if needed (Mongoose objects usually need .toObject() but here we intercept JSON which is already plain or handled by toJSON)
    if (data instanceof Date) return data;

    const clean = {};
    const allowedFields = [
      // API Standard Wrappers
      "success",
      "message",
      "data",
      "count",
      "token",
      "accessToken",
      "displayToken",
      "status",

      // Common DB
      "_id",
      "id",
      "createdAt",
      "updatedAt",

      // User / Admin
      "username",
      "role",
      "isActive",
      "mustChangePassword",

      // Activation Code
      "durationDays",
      "maxDevices",
      "firstActivatedAt",
      "expiresAt",
      "usage",

      // Session
      "deviceId",
      "ipAddress",
      "userAgent", // Also in Channel
      "isRevoked",
      "lastActive",
      "sessionId",
      "sessions", // Assuming this is a list of sessions

      // Channel
      "name",
      "category",
      "logoUrl",
      "streamUrl",
      "referer",

      // StreamProvider
      "type",
      "dns",
      // 'username' is already allowed above
    ];

    if (process.env.NODE_ENV !== "production") {
      allowedFields.push("error", "stack");
    }

    Object.keys(data).forEach((key) => {
      // 1. Explicitly ALLOW 'code' if flag is set (Create/Reveal)
      if (key === "code" && allowCode) {
        clean[key] = data[key];
        return;
      }

      // 2. Recursively sanitize nested objects/arrays regardless of key name if the key is generic (like 'user' or 'items')
      // OR just recurse for EVERYTHING that passes whitelist?
      // If key is NOT in whitelist, we drop it?
      // What about "user" object inside "data"? "user" is not in whitelist?
      // I should allow keys that CONTAIN objects, but sanitize the values.
      // But how do I distinguish a "Field" from a "Container"?

      // Strategy:
      // If the value is an Object or Array, we recurse.
      // If the value is a Primitive, we checks the whitelist.

      // WAIT. If I recurse on "password": "123", it's a primitive. key="password". Check whitelist. Not there. DROP. Correct.
      // If I recurse on "user": { username: "abc", password: "123" }.
      // key="user". Is it in whitelist?
      // If "user" is NOT in whitelist, I drop the whole user object? That's bad.
      // So I need to add "user", "items", "sessions" etc to whitelist.

      const containers = ["user", "sessions", "items", "provider", "channel"];

      if (allowedFields.includes(key) || containers.includes(key)) {
        clean[key] = sanitize(data[key], allowCode);
      }
    });

    return clean;
  }

  return data;
};

module.exports = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    // Apply sanitization
    // Allow 'code' only for POST /api/admin/code
    // Note: Adjust path matching to your routes
    const isCreateCode =
      (req.method === "POST" && req.originalUrl.includes("/api/admin/code")) ||
      (req.method === "GET" && req.originalUrl.includes("/display"));

    // We assume body is the object to be sent.
    // If body has .toObject (Mongoose doc), we might want to call it, but res.json handles that.
    // However, we need to inspect the properties. JSON.stringify usually calls .toJSON().
    // We should probably rely on JSON serialization first?
    // If we sanitize *before* toJSON, we might miss virtuals or getters.
    // Optimally, we clone: JSON.parse(JSON.stringify(body)) then sanitize.
    // This ensures we work with the final shape.
    let jsonBody = body;
    try {
      jsonBody = JSON.parse(JSON.stringify(body));
    } catch (e) {
      // failed to parse?
    }

    const cleaned = sanitize(jsonBody, isCreateCode);
    return originalJson.call(this, cleaned);
  };

  next();
};
