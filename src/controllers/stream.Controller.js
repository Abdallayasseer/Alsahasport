const Channel = require("../models/Channel.model");
const sendResponse = require("../utils/responseHandler");

// @desc    
// @route   GET /api/stream/channels
// @access  Private (Needs Token)
exports.getChannels = async (req, res, next) => {
  try {
    const { category } = req.query;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    const channels = await Channel.find(query).select("-__v"); 

    sendResponse(res, 200, true, "Channels retrieved successfully", channels);
  } catch (error) {
    next(error);
  }
};

// @desc  
// @route   GET /api/stream/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Channel.distinct("category", { isActive: true });
    sendResponse(
      res,
      200,
      true,
      "Categories retrieved successfully",
      categories
    );
  } catch (error) {
    next(error);
  }
};

// @desc    
// @route   GET /api/stream/channel/:id
// @access  Private
exports.getChannelStream = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel || !channel.isActive) {
      return sendResponse(res, 404, false, "Channel not found or inactive");
    }


    sendResponse(res, 200, true, "Stream ready", {
      name: channel.name,
      url: channel.streamUrl, 
      logo: channel.logoUrl,
    });
  } catch (error) {
    next(error);
  }
};
