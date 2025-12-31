const mongoose = require("mongoose");

const activationCodeSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    codeEncrypted: {
      type: String,
      select: false, // Protected, only for master admin recovery
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
    viewed: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Compound Index for frequent queries filtering by status and creator
activationCodeSchema.index({ status: 1, createdBy: 1 });
activationCodeSchema.index({ codeHash: 1 }, { unique: true }); // Explicitly redundant but good for clarity/ensuring

module.exports = mongoose.model("ActivationCode", activationCodeSchema);
