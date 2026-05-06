const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  return successResponse(res, "Users fetched successfully", users);
};

exports.updateProfile = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select("-password");
  if (!user) return errorResponse(res, "User not found", 404);
  return successResponse(res, "Profile updated", user);
};
