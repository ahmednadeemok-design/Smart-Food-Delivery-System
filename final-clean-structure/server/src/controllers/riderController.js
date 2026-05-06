const Rider = require("../models/Rider");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createRiderProfile = async (req, res) => {
  try {
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, "Rider profile saved", rider, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.updateLocation = async (req, res) => {
  const isOnline = req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : true;
  const rider = await Rider.findOneAndUpdate(
    { user: req.user._id },
    { currentLocation: req.body.currentLocation, isOnline },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return successResponse(res, "Rider location updated", rider);
};

exports.getRiders = async (req, res) => {
  const riders = await Rider.find().populate("user", "name email phone");
  return successResponse(res, "Riders fetched successfully", riders);
};
