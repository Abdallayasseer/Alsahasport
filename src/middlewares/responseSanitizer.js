const sanitize = (data, allowCode) => {
  // 1. Base cases
  if (!data) return data;
  if (data instanceof Date) return data; // Keep Date objects intact
  if (Array.isArray(data)) return data.map((item) => sanitize(item, allowCode));
  if (typeof data !== "object") return data; // Strings, numbers, booleans

  // 2. Handle Mongoose Documents & objects with toJSON/toObject
  // This prevents circular reference issues and gets the clean data object
  let plainData = data;
  if (typeof data.toObject === "function") {
    plainData = data.toObject();
  } else if (typeof data.toJSON === "function") {
    plainData = data.toJSON();
  }

  // 3. Prepare the clean object
  const clean = {};

  // Whitelist (القائمة البيضاء للمفاتيح المسموح بمرورها)
  const allowedFields = [
    // API Standards
    "success",
    "message",
    "data",
    "count",
    "token",
    "accessToken",
    "displayToken",
    "status",
    "statusCode",

    // IDs & Timestamps
    "_id",
    "id",
    "createdAt",
    "updatedAt",

    // Users & Admins
    "username",
    "role",
    "isActive",
    "mustChangePassword",
    "email",

    // Activation Codes
    "durationDays",
    "maxDevices",
    "firstActivatedAt",
    "expiresAt",
    "usage",

    // Sessions
    "deviceId",
    "ipAddress",
    "userAgent",
    "isRevoked",
    "lastActive",
    "sessionId",

    // Channels & Streams
    "name",
    "category",
    "logoUrl",
    "streamUrl",
    "referer",
    "type",
    "dns",

    // Dashboard Stats
    "stats",
    "totalUsers",
    "activeSessions",
    "totalCodes",
    "revenue",
    "serverStatus",
    "trends",
    "recentActivity",
    "liveSessions",
    "analytics",
    "codesChart",
    "sessionsChart",
    "roleDistribution",
    "date",
    "value",
    "title",
    "time",
    "details",
  ];

  // Allow Errors in Development only
  if (process.env.NODE_ENV !== "production") {
    allowedFields.push("error", "stack");
  }

  // Nested Containers (Keys that contain objects/arrays to be recursively checked)
  const containers = [
    "user",
    "sessions",
    "items",
    "provider",
    "channel",
    "stats",
    "analytics",
    "recentActivity",
    "liveSessions",
    "trends",
    "codesChart",
    "sessionsChart",
    "roleDistribution",
    "data",
  ];

  Object.keys(plainData).forEach((key) => {
    // A. Special Case: Activation Code
    if (key === "code") {
      if (allowCode) clean[key] = plainData[key];
      return;
    }

    // B. Recursive Sanitization
    // If the key is in whitelist OR it's a container, we process it.
    if (allowedFields.includes(key) || containers.includes(key)) {
      clean[key] = sanitize(plainData[key], allowCode);
    }
  });

  return clean;
};

module.exports = (req, res, next) => {
  const originalJson = res.json;

  // Override res.json
  res.json = function (body) {
    // Safety check: if body is null/undefined, just send it
    if (!body) return originalJson.call(this, body);

    // Determine if we should show the "code" field
    // (Adjust logical paths as needed)
    const isCreateCode =
      (req.method === "POST" && req.originalUrl.includes("/codes")) || // Adjusted path usually /api/admin/codes
      (req.method === "GET" && req.originalUrl.includes("/display"));

    try {
      // Pass the body directly to sanitize (no JSON.parse/stringify needed now)
      const cleaned = sanitize(body, isCreateCode);
      return originalJson.call(this, cleaned);
    } catch (err) {
      console.error("Sanitizer Critical Failure:", err);
      // Fail Safe: If sanitization crashes, try to send a generic error
      // instead of crashing the process or looping.
      return res.status(500).send({
        status: "error",
        message: "Internal Server Error (Serialization Failure)",
      });
    }
  };

  next();
};
