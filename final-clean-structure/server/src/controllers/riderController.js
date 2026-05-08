const Rider = require("../models/Rider");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { clampLocation } = require("../constants/narowal");

const sanitizeRiderPayload = (body = {}) => ({
  vehicleType: ["bike", "car", "cycle"].includes(body.vehicleType) ? body.vehicleType : "bike",
  cnic: String(body.cnic || "").trim(),
  bikeNumber: String(body.bikeNumber || "").trim(),
  profileImage: body.profileImage || "",
  phoneVerified: Boolean(body.phoneVerified),
  currentLocation: clampLocation(body.currentLocation || body.location),
  isOnline: body.isOnline !== undefined ? Boolean(body.isOnline) : false,
  isActive: true,
});

exports.createRiderProfile = async (req, res) => {
  try {
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      { ...sanitizeRiderPayload(req.body), user: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, "Rider profile saved", rider, 201);
  } catch (error) {
    return errorResponse(res, "Unable to save rider profile", 500);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const isOnline = req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : true;
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        currentLocation: clampLocation(req.body.currentLocation),
        isOnline,
        isActive: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const io = req.app.get("io");
    if (io) io.emit("rider-location-updated", { riderId: rider._id, location: rider.currentLocation, rider });
    return successResponse(res, "Rider location updated", rider);
  } catch (error) {
    return errorResponse(res, "Unable to update rider location", 500);
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const existing = await Rider.findOne({ user: req.user._id });
    if (existing) {
      if (existing.isSuspended || existing.isActive === false) return errorResponse(res, "Rider account is not active for deliveries", 403);
      if (existing.approvalStatus !== "approved") return errorResponse(res, "Rider profile is pending admin approval", 403);
    }
    const activeOrders = existing?.activeOrders?.length || 0;
    const nextOnline = Boolean(req.body.isOnline);
    const rider = await Rider.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        isOnline: nextOnline,
        availabilityStatus: nextOnline ? (activeOrders > 0 ? "busy" : "online") : "approved_offline",
        currentLocation: clampLocation(req.body.currentLocation),
        isActive: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return successResponse(res, rider.isOnline ? "Rider is online" : "Rider is offline", rider);
  } catch (error) {
    return errorResponse(res, "Unable to update rider availability", 500);
  }
};

exports.getRiders = async (req, res) => {
  const riders = await Rider.find().populate("user", "name email phone").populate("activeOrders");
  return successResponse(res, "Riders fetched successfully", riders);
};

exports.getMyRiderProfile = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id }).populate("user", "name email phone trustScore");
  if (!rider) {
    return successResponse(res, "Complete rider profile to start accepting deliveries", {
      rider: null,
      needsProfile: true,
    });
  }
  const completedToday = rider.completedDeliveries || 0;
  return successResponse(res, "Rider profile fetched", {
    rider,
    needsProfile: false,
    rating: Math.round((rider.trustScore / 20) * 10) / 10,
    dailyEarnings: rider.dailyEarnings || completedToday * 95,
    weeklyEarnings: rider.weeklyEarnings || completedToday * 95 * 5,
    trustScore: rider.trustScore,
  });
};
