const mongoose = require("mongoose");

const activationCodeSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Retaining 'code' ONLY for backward compatibility or display if needed,
    // but in a real secure system we remove it.
    // For this refactor, we will rely on codeHash for auth.
    code: {
      type: String,
      select: false,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["unused", "active", "expired", "banned"],
      default: "unused",
    },
    firstActivatedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    maxDevices: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivationCode", activationCodeSchema);
