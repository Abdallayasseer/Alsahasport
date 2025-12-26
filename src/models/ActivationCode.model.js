const mongoose = require("mongoose");

const activationCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
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
