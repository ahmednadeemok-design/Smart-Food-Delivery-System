const Rider = require("../models/Rider");
const Order = require("../models/Order");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { clampLocation } = require("../constants/narowal");

const sanitizeRiderPayload = (body = {}) => ({
  vehicleType: ["bike", "car", "cycle"].includes(body.vehicleType) ? body.vehicleType : "bike",
  cnic: String(body.cnic || "").trim(),
  bikeNumber: String(body.bikeNumber || "").trim(),
  vehicleNumber: String(body.vehicleNumber || body.bikeNumber || "").trim(),
  drivingLicence: String(body.drivingLicence || body.drivingLicense || "").trim(),
  drivingLicense: String(body.drivingLicense || body.drivingLicence || "").trim(),
  emergencyContact: String(body.emergencyContact || "").trim(),
  preferredArea: String(body.preferredArea || "").trim(),
  ageConfirmed: Boolean(body.ageConfirmed),
  paymentAccountType: ["JazzCash", "EasyPaisa", "HBL Konnect", "NayaPay", "SadaPay", "Bank"].includes(body.paymentAccountType) ? body.paymentAccountType : "",
  accountTitle: String(body.accountTitle || "").trim(),
  paymentAccountNumber: String(body.paymentAccountNumber || body.accountNumber || "").trim(),
  iban: String(body.iban || "").trim(),
  paymentAccount: {
    type: body.paymentAccountType || "",
    title: body.accountTitle || "",
    number: body.paymentAccountNumber || body.accountNumber || "",
    iban: body.iban || "",
  },
  profileImage: body.profileImage || "",
  phoneVerified: Boolean(body.phoneVerified),
  currentLocation: clampLocation(body.currentLocation || body.location),
  isOnline: body.isOnline !== undefined ? Boolean(body.isOnline) : false,
  isActive: true,
});

const activeStatuses = ["assigned", "picked"];

const populateRider = (query) =>
  query
    .populate("user", "name email phone trustScore")
    .populate({
      path: "activeOrder",
      populate: [
        { path: "customer", select: "name email phone" },
        { path: "restaurant", select: "name address location phone localArea" },
      ],
    })
    .populate({
      path: "activeOrders",
      populate: [
        { path: "customer", select: "name email phone" },
        { path: "restaurant", select: "name address location phone localArea" },
      ],
    });

exports.createRiderProfile = async (req, res) => {
  try {
    if (!req.body.ageConfirmed) return errorResponse(res, "Confirm that rider is 18 or older.", 400);
    if (!req.body.cnic) return errorResponse(res, "CNIC is required.", 400);
    if (!req.body.bikeNumber && !req.body.vehicleNumber) return errorResponse(res, "Vehicle number is required.", 400);
    if (!req.body.emergencyContact) return errorResponse(res, "Emergency contact is required.", 400);
    if (!req.body.paymentAccountNumber && !req.body.accountNumber && !req.body.iban) return errorResponse(res, "Payment account number or IBAN is required.", 400);
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

exports.updateRiderProfile = exports.createRiderProfile;

exports.updateLocation = async (req, res) => {
  try {
    const isOnline = req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : true;
    const existing = await Rider.findOne({ user: req.user._id });
    if (existing?.isSuspended || existing?.approvalStatus === "suspended") return errorResponse(res, "Suspended riders cannot update live location", 403);
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
      if (existing.approvalStatus !== "approved") return errorResponse(res, existing.approvalStatus === "suspended" ? "Rider account is suspended" : "Rider profile is pending admin approval", 403);
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
  const riders = await Rider.find().populate("user", "name email phone").populate("activeOrders activeOrder");
  return successResponse(res, "Riders fetched successfully", riders);
};

exports.getMyRiderProfile = async (req, res) => {
  const rider = await populateRider(Rider.findOne({ user: req.user._id }));
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
    status: rider.isSuspended || rider.approvalStatus === "suspended" ? "suspended" : rider.approvalStatus === "pending" ? "pending" : rider.approvalStatus === "rejected" ? "rejected" : rider.availabilityStatus,
  });
};

exports.getActiveOrder = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return successResponse(res, "No rider profile found", null);
  const order = await Order.findOne({ rider: rider._id, status: { $in: activeStatuses } })
    .populate("customer", "name email phone")
    .populate("restaurant", "name address location phone localArea")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
    .sort("-updatedAt");
  return successResponse(res, order ? "Active order fetched" : "No active delivery", order);
};

exports.getRiderHistory = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return successResponse(res, "No rider profile found", []);
  const orders = await Order.find({ rider: rider._id, status: { $in: ["delivered", "cancelled", "rejected"] } })
    .populate("customer", "name phone")
    .populate("restaurant", "name address localArea")
    .sort("-updatedAt")
    .limit(100);
  return successResponse(res, "Rider delivery history fetched", orders);
};

exports.getRiderEarnings = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return successResponse(res, "No rider profile found", null);
  const recent = await Order.find({ rider: rider._id, status: "delivered" })
    .populate("restaurant", "name localArea")
    .sort("-deliveredAt")
    .limit(20);
  return successResponse(res, "Rider earnings fetched", {
    todayEarnings: rider.dailyEarnings || 0,
    weeklyEarnings: rider.weeklyEarnings || 0,
    totalEarnings: rider.totalLifetimeEarnings || rider.earnings || 0,
    pendingPayout: rider.pendingPayout || 0,
    codCollectedToday: rider.codCollectedToday || 0,
    completedDeliveries: rider.completedDeliveries || 0,
    walletBalance: rider.walletBalance || 0,
    recent,
  });
};
