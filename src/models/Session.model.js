const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    codeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActivationCode",
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model("Session", sessionSchema);
