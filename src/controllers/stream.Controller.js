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

  res.status(200).json({
    success: true,
    message: "Stream ready",
    data: {
      name: channel.name,
      url: channel.streamUrl,
      logo: channel.logoUrl,
    },
  });
});
