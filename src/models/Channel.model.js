const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true }, 
    logoUrl: String,
    streamUrl: { type: String, required: true }, 
    userAgent: String, 
    referer: String, 
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Channel", channelSchema);
