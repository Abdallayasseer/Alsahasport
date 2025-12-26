const mongoose = require("mongoose");

const streamProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["xtream", "m3u"], default: "xtream" },
    dns: { type: String, required: true },
    username: { type: String },
    password: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StreamProvider", streamProviderSchema);
