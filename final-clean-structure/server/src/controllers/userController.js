const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { clampLocation, isNarowalAddress, isPakistaniPhone, resolveNarowalArea } = require("../constants/narowal");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  return successResponse(res, "Users fetched successfully", users);
};

exports.updateProfile = async (req, res) => {
  const allowed = ["name", "phone", "avatar", "address", "location", "healthProfile"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = key === "location" ? clampLocation(req.body[key]) : req.body[key];
  });
  if (updates.phone && !isPakistaniPhone(updates.phone)) return errorResponse(res, "Use Pakistani phone format +92XXXXXXXXXX", 400);
  if (updates.address && !isNarowalAddress(updates.address)) return errorResponse(res, "Address must be inside supported Narowal areas", 400);

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) return errorResponse(res, "User not found", 404);
  return successResponse(res, "Profile updated", user);
};

exports.addSavedAddress = async (req, res) => {
  const { label, address, location } = req.body;
  if (!address || !isNarowalAddress(address)) return errorResponse(res, "Choose a supported Narowal delivery area", 400);

  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, "User not found", 404);
  if (req.body.isDefault) user.savedAddresses.forEach((item) => { item.isDefault = false; });
  user.savedAddresses.push({
    label: label || resolveNarowalArea(address) || "Narowal address",
    address,
    area: resolveNarowalArea(address),
    location: clampLocation(location),
    isDefault: Boolean(req.body.isDefault),
  });
  if (!user.address || req.body.isDefault) {
    user.address = address;
    user.location = clampLocation(location);
  }
  await user.save();
  return successResponse(res, "Address saved", user.savedAddresses);
};

exports.deleteSavedAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, "User not found", 404);
  user.savedAddresses = user.savedAddresses.filter((item) => String(item._id) !== String(req.params.id));
  await user.save();
  return successResponse(res, "Address removed", user.savedAddresses);
};
