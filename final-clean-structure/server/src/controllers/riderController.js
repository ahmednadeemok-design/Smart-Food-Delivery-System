const Rider = require("../models/Rider");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createRiderProfile = async (req, res) => {
  try {
    const rider = await Rider.create({ ...req.body, user: req.user._id });
    return successResponse(res, "Rider profile created", rider, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.updateLocation = async (req, res) => {
  const rider = await Rider.findOneAndUpdate(
    { user: req.user._id },
    { currentLocation: req.body.currentLocation, isOnline: true },
    { new: true }
  );
  if (!rider) return errorResponse(res, "Rider profile not found", 404);
  return successResponse(res, "Rider location updated", rider);
};

exports.getRiders = async (req, res) => {
  const riders = await Rider.find().populate("user", "name email phone");
  return successResponse(res, "Riders fetched successfully", riders);
};
