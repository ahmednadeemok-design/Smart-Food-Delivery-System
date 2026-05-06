const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const TrustScore = require("../models/TrustScore");
const AdminAuditLog = require("../models/AdminAuditLog");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const clampScore = (score) => Math.max(0, Math.min(100, Number(score)));
const allowedRoles = ["customer", "rider", "restaurant", "admin"];
const allowedOrderStatuses = ["pending", "accepted", "preparing", "ready", "picked", "delivered", "cancelled"];

const logAction = (req, action, targetType, targetId, reason, metadata = {}) =>
  AdminAuditLog.create({ admin: req.user._id, action, targetType, targetId, reason, metadata });

exports.listUsers = async (req, res) => {
  const users = await User.find().select("-password").sort("-createdAt");
  return successResponse(res, "Admin users fetched", users);
};

exports.updateUser = async (req, res) => {
  const updates = {};
  if (req.body.isBlocked !== undefined) updates.isBlocked = Boolean(req.body.isBlocked);
  if (req.body.blockReason !== undefined) updates.blockReason = req.body.blockReason;
  if (req.body.role !== undefined) {
    if (!allowedRoles.includes(req.body.role)) return errorResponse(res, "Invalid role", 400);
    updates.role = req.body.role;
  }
  if (req.body.trustScore !== undefined) updates.trustScore = clampScore(req.body.trustScore);

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) return errorResponse(res, "User not found", 404);
  await logAction(req, "user.update", "user", user._id, req.body.reason, updates);
  return successResponse(res, "User updated", user);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, "User not found", 404);
  if (String(user._id) === String(req.user._id)) return errorResponse(res, "Admin cannot delete their own account", 400);
  await Promise.all([Rider.deleteMany({ user: user._id }), Restaurant.deleteMany({ owner: user._id })]);
  await user.deleteOne();
  await logAction(req, "user.delete", "user", user._id, req.body?.reason || "Admin deleted user");
  return successResponse(res, "User deleted", { id: req.params.id });
};

exports.listRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find().populate("owner", "name email phone").sort("-createdAt");
  return successResponse(res, "Admin restaurants fetched", restaurants);
};

exports.updateRestaurant = async (req, res) => {
  const allowed = ["name", "description", "phone", "address", "localArea", "location", "image", "cuisineTypes", "isOpen", "isActive", "approvalStatus", "qualityFlag", "qualityFlagReason", "kitchenLoad", "averagePreparationTime", "accuracyRate", "trustScore", "rating"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (updates.approvalStatus && !["pending", "approved", "rejected"].includes(updates.approvalStatus)) {
    return errorResponse(res, "Invalid restaurant approval status", 400);
  }
  if (updates.trustScore !== undefined) updates.trustScore = clampScore(updates.trustScore);

  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("owner", "name email phone");
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  await logAction(req, "restaurant.update", "restaurant", restaurant._id, req.body.reason, updates);
  return successResponse(res, "Restaurant updated", restaurant);
};

exports.deleteRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  await Promise.all([FoodItem.deleteMany({ restaurant: restaurant._id }), Order.updateMany({ restaurant: restaurant._id }, { status: "cancelled" })]);
  await restaurant.deleteOne();
  await logAction(req, "restaurant.delete", "restaurant", restaurant._id, req.body?.reason || "Admin deleted restaurant");
  return successResponse(res, "Restaurant deleted", { id: req.params.id });
};

exports.getRestaurantMenu = async (req, res) => {
  const items = await FoodItem.find({ restaurant: req.params.id }).sort("category name");
  return successResponse(res, "Restaurant menu fetched", items);
};

exports.listRiders = async (req, res) => {
  const riders = await Rider.find().populate("user", "name email phone trustScore isBlocked").populate("activeOrders").sort("-createdAt");
  return successResponse(res, "Admin riders fetched", riders);
};

exports.updateRider = async (req, res) => {
  const allowed = ["approvalStatus", "isActive", "isOnline", "isSuspended", "suspensionReason", "trustScore", "workloadScore", "maxBatchOrders"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (updates.approvalStatus && !["pending", "approved", "rejected"].includes(updates.approvalStatus)) {
    return errorResponse(res, "Invalid rider approval status", 400);
  }
  if (updates.trustScore !== undefined) updates.trustScore = clampScore(updates.trustScore);
  if (updates.isSuspended) updates.isOnline = false;

  const rider = await Rider.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("user", "name email phone trustScore isBlocked");
  if (!rider) return errorResponse(res, "Rider not found", 404);
  await logAction(req, "rider.update", "rider", rider._id, req.body.reason, updates);
  return successResponse(res, "Rider updated", rider);
};

exports.listOrders = async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {};
  const orders = await Order.find(query).populate("customer", "name email phone").populate("restaurant", "name address localArea").populate({ path: "rider", populate: { path: "user", select: "name email phone" } }).sort("-createdAt");
  return successResponse(res, "Admin orders fetched", orders);
};

exports.updateOrder = async (req, res) => {
  const updates = {};
  if (req.body.status !== undefined) {
    if (!allowedOrderStatuses.includes(req.body.status)) return errorResponse(res, "Invalid order status", 400);
    updates.status = req.body.status;
  }
  if (req.body.rider !== undefined) {
    const rider = await Rider.findById(req.body.rider);
    if (!rider) return errorResponse(res, "Rider not found", 404);
    updates.rider = rider._id;
  }

  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  Object.assign(order, updates);
  if (updates.status) {
    order.statusTimeline.push({ status: updates.status, label: req.body.reason || `Admin forced status ${updates.status}`, at: new Date() });
    if (updates.status === "cancelled") order.paymentStatus = "failed";
  }
  await order.save();
  await logAction(req, "order.update", "order", order._id, req.body.reason, updates);
  return successResponse(res, "Order updated", order);
};

exports.listComplaints = async (req, res) => {
  const complaints = await Complaint.find().populate("order customer").sort("-createdAt");
  return successResponse(res, "Admin complaints fetched", complaints);
};

exports.updateComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate("order");
  if (!complaint) return errorResponse(res, "Complaint not found", 404);
  if (req.body.status) complaint.status = req.body.status;
  if (req.body.compensation !== undefined) complaint.compensation = Math.max(0, Number(req.body.compensation) || 0);
  if (req.body.aiDecision) complaint.aiDecision = req.body.aiDecision;
  await complaint.save();

  if (req.body.penaltyTarget && req.body.penaltyAmount) {
    await applyTrustChange(req, req.body.penaltyTarget, req.body.penaltyTargetId, -Math.abs(Number(req.body.penaltyAmount)), req.body.reason || "Complaint penalty");
  }

  await logAction(req, "complaint.update", "complaint", complaint._id, req.body.reason, req.body);
  return successResponse(res, "Complaint updated", complaint);
};

exports.listPayments = async (req, res) => {
  const payments = await Payment.find().populate("order user", "name email totalAmount status").sort("-createdAt");
  return successResponse(res, "Admin payments fetched", payments);
};

exports.refundPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return errorResponse(res, "Payment not found", 404);
  if (req.body.approved) {
    payment.status = "refunded";
    payment.refundReason = req.body.reason || "Admin approved refund";
    payment.refundedAt = new Date();
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "refunded" });
  } else {
    payment.refundReason = req.body.reason || "Admin rejected refund";
  }
  await payment.save();
  await logAction(req, req.body.approved ? "payment.refund.approve" : "payment.refund.reject", "payment", payment._id, req.body.reason);
  return successResponse(res, "Refund decision saved", payment);
};

const applyTrustChange = async (req, actorType, actorId, change, reason) => {
  const numericChange = Number(change);
  if (!["customer", "rider", "restaurant"].includes(actorType)) throw new Error("Invalid actor type");

  let nextScore = 100;
  if (actorType === "restaurant") {
    const restaurant = await Restaurant.findById(actorId);
    if (!restaurant) throw new Error("Restaurant not found");
    restaurant.trustScore = clampScore((restaurant.trustScore ?? 100) + numericChange);
    nextScore = restaurant.trustScore;
    await restaurant.save();
  } else if (actorType === "rider") {
    const rider = await Rider.findById(actorId);
    if (!rider) throw new Error("Rider not found");
    rider.trustScore = clampScore((rider.trustScore ?? 100) + numericChange);
    nextScore = rider.trustScore;
    await rider.save();
  } else {
    const user = await User.findById(actorId);
    if (!user) throw new Error("User not found");
    user.trustScore = clampScore((user.trustScore ?? 100) + numericChange);
    nextScore = user.trustScore;
    await user.save();
  }

  const log = await TrustScore.create({ actorType, actorId, score: nextScore, change: numericChange, reason });
  await logAction(req, "trust.change", actorType, actorId, reason, { change: numericChange, score: nextScore });
  return log;
};

exports.adjustTrustScore = async (req, res) => {
  try {
    const log = await applyTrustChange(req, req.body.actorType, req.body.actorId, req.body.change, req.body.reason || "Admin trust adjustment");
    return successResponse(res, "Trust score updated", log);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

exports.getTrustHistory = async (req, res) => {
  const query = {};
  if (req.query.actorType) query.actorType = req.query.actorType;
  if (req.query.actorId) query.actorId = req.query.actorId;
  const history = await TrustScore.find(query).sort("-createdAt").limit(100);
  return successResponse(res, "Trust history fetched", history);
};

exports.getAuditLogs = async (req, res) => {
  const logs = await AdminAuditLog.find().populate("admin", "name email").sort("-createdAt").limit(100);
  return successResponse(res, "Admin audit logs fetched", logs);
};
