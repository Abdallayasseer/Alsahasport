const Channel = require("../models/Channel.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// @desc
// @route   GET /api/stream/channels
// @access  Private (Needs Token)
exports.getChannels = catchAsync(async (req, res, next) => {
  const { category } = req.query;

  let query = { isActive: true };

  if (category) {
    query.category = category;
  }

  const channels = await Channel.find(query).select("-__v");

  res.status(200).json({
    success: true,
    message: "Channels retrieved successfully",
    data: channels,
  });
});

// @desc
// @route   GET /api/stream/categories
// @access  Private
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = await Channel.distinct("category", { isActive: true });
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    data: categories,
  });
});

// @desc
// @route   GET /api/stream/channel/:id
// @access  Private
exports.getChannelStream = catchAsync(async (req, res, next) => {
  const channel = await Channel.findById(req.params.id);

  if (!channel || !channel.isActive) {
    return next(new AppError("Channel not found or inactive", 404));
  }

  // SIGNED URL GENERATION
  // Assuming the stream server expects path + expires + IP + secret
  // For this generic implementation, we will append a signature
  const secret = process.env.STREAM_SECRET || "super_secret_stream_key";
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
  const userIp = req.ip;
  const sessionId = req.user.sessionId ? req.user.sessionId.toString() : "";

  // Data to sign: url + expiry + ip + session (binds URL to specific user session/IP)
  const dataToSign = `${channel.streamUrl}:${expires}:${userIp}:${sessionId}`;

  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  // Append to URL (naive append, usually depends on provider e.g. Flussonic, Wowza, Nginx)
  // We will assume a standard ?token= format or similar.
  // Let's use a generic 'token' param containing the signature and metadata
  const cleanUrl = channel.streamUrl;
  const separator = cleanUrl.includes("?") ? "&" : "?";
  const signedUrl = `${cleanUrl}${separator}expires=${expires}&signature=${signature}&session=${sessionId}`;

  res.status(200).json({
    success: true,
    message: "Stream ready",
    data: {
      name: channel.name,
      url: signedUrl,
      logo: channel.logoUrl,
      expiresAt: expires,
    },
  });
});
