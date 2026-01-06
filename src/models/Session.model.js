const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel", // Dynamic Reference
      index: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ["ActivationCode", "Admin"],
      default: "ActivationCode",
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    userAgent: String,
    ipAddress: String, // Kept for backward compatibility (stores best guess)
    clientPublicIp: String,
    proxyDetectedIp: String,
    ipConfidence: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "LOW",
    },
    deviceId: { type: String, required: true },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL Index
    },
  },
  { timestamps: true }
);

// Compound index for fast lookup of a user's specific device session
sessionSchema.index({ userId: 1, deviceId: 1 });

module.exports = mongoose.model("Session", sessionSchema);
