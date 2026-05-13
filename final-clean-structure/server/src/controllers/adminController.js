const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const TrustScore = require("../models/TrustScore");
const AdminAuditLog = require("../models/AdminAuditLog");
const Campaign = require("../models/Campaign");
const SupportTicket = require("../models/SupportTicket");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { settleCodDelivery } = require("../services/financeService");
const { sendRestaurantApproval, sendRiderApproval, sendTemporaryPassword, sendOrderUpdate } = require("../utils/emailService");
const { emitAdminRealtime, emitOrderRealtime, emitRestaurantRealtime, emitRiderRealtime } = require("../services/realtimeService");
const {
  ACTIVE_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildOrderScopeQuery,
  enrichOrderSearchQuery,
  markArchivedIfTerminal,
  paginationFromQuery,
} = require("../services/orderLifecycleService");

const clampScore = (score) => Math.max(0, Math.min(100, Number(score)));
const allowedRoles = ["customer", "rider", "restaurant", "admin"];
const allowedOrderStatuses = ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way", "delivered", "cancelled", "rejected"];

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

exports.issuePasswordReset = async (req, res) => {
  const user = await User.findById(req.params.id).select("+password");
  if (!user) return errorResponse(res, "User not found", 404);
  const temporaryPassword = `SF-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  user.password = temporaryPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await sendTemporaryPassword(user, temporaryPassword);
  await logAction(req, "user.password_reset.issue", "user", user._id, req.body?.reason || "Admin issued temporary password");
  return successResponse(res, "Temporary password issued. It is shown once and emailed when email is enabled.", {
    user: { id: user._id, email: user.email },
    temporaryPassword,
  });
};

exports.listRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find().populate("owner", "name email phone").sort("-createdAt");
  return successResponse(res, "Admin restaurants fetched", restaurants);
};

exports.getRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate("owner", "name email phone isBlocked");
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  const [menu, orders, campaigns, supportTickets] = await Promise.all([
    FoodItem.find({ restaurant: restaurant._id }).sort("category name"),
    Order.find({ restaurant: restaurant._id }).populate("customer", "name email phone").populate({ path: "rider", populate: { path: "user", select: "name email phone" } }).sort("-createdAt").limit(50),
    Campaign.find({ restaurant: restaurant._id }).sort("-createdAt"),
    SupportTicket.find({ restaurant: restaurant._id }).populate("owner", "name email phone").sort("-createdAt"),
  ]);
  return successResponse(res, "Restaurant fetched", { restaurant, menu, orders, campaigns, supportTickets });
};

exports.updateRestaurant = async (req, res) => {
  const allowed = ["name", "description", "phone", "supportContact", "address", "localArea", "location", "image", "logo", "banner", "cuisineTypes", "businessHours", "isOpen", "isActive", "approvalStatus", "qualityFlag", "qualityFlagReason", "kitchenLoad", "averagePreparationTime", "accuracyRate", "trustScore", "rating"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (updates.approvalStatus && !["pending", "pending_review", "approved", "rejected", "suspended"].includes(updates.approvalStatus)) {
    return errorResponse(res, "Invalid restaurant approval status", 400);
  }
  if (updates.trustScore !== undefined) updates.trustScore = clampScore(updates.trustScore);

  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("owner", "name email phone");
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  if (updates.approvalStatus === "approved") await sendRestaurantApproval(restaurant);
  await logAction(req, "restaurant.update", "restaurant", restaurant._id, req.body.reason, updates);
  emitRestaurantRealtime(req, "restaurant:state-updated", restaurant);
  return successResponse(res, "Restaurant updated", restaurant);
};

exports.approveRestaurant = (req, res) => {
  req.body.approvalStatus = "approved";
  req.body.isActive = true;
  return exports.updateRestaurant(req, res);
};

exports.rejectRestaurant = (req, res) => {
  req.body.approvalStatus = "rejected";
  req.body.isOpen = false;
  return exports.updateRestaurant(req, res);
};

exports.suspendRestaurant = (req, res) => {
  req.body.approvalStatus = "suspended";
  req.body.isOpen = false;
  req.body.isActive = false;
  return exports.updateRestaurant(req, res);
};

exports.reactivateRestaurant = (req, res) => {
  req.body.approvalStatus = "approved";
  req.body.isActive = true;
  return exports.updateRestaurant(req, res);
};

exports.resetRestaurantOwnerPassword = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return errorResponse(res, "Restaurant not found", 404);
  req.params.id = restaurant.owner;
  return exports.issuePasswordReset(req, res);
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

exports.listRestaurantSupportTickets = async (req, res) => {
  const tickets = await SupportTicket.find()
    .populate("restaurant", "name localArea approvalStatus")
    .populate("owner", "name email phone")
    .populate("order", "status totalAmount")
    .sort("-createdAt");
  return successResponse(res, "Restaurant support tickets fetched", tickets);
};

exports.updateRestaurantSupportTicket = async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote },
    { new: true, runValidators: true }
  )
    .populate("restaurant", "name localArea")
    .populate("owner", "name email phone");
  if (!ticket) return errorResponse(res, "Support ticket not found", 404);
  await logAction(req, "restaurant.support.update", "support_ticket", ticket._id, req.body.adminNote || "Support ticket updated");
  emitAdminRealtime(req, "admin:support-ticket-updated", { ticket });
  if (ticket.restaurant) emitRestaurantRealtime(req, "restaurant:support-notification", ticket.restaurant, { ticket });
  return successResponse(res, "Support ticket updated", ticket);
};

exports.listRiders = async (req, res) => {
  const riders = await Rider.find().populate("user", "name email phone trustScore isBlocked").populate("activeOrders activeOrder").sort("-createdAt");
  return successResponse(res, "Admin riders fetched", riders);
};

exports.getRider = async (req, res) => {
  const rider = await Rider.findById(req.params.id)
    .populate("user", "name email phone trustScore isBlocked")
    .populate({
      path: "activeOrder activeOrders",
      populate: [
        { path: "customer", select: "name phone email" },
        { path: "restaurant", select: "name address location" },
      ],
    });
  if (!rider) return errorResponse(res, "Rider not found", 404);
  return successResponse(res, "Rider fetched", rider);
};

exports.updateRider = async (req, res) => {
  const allowed = ["approvalStatus", "isActive", "isOnline", "isSuspended", "suspensionReason", "trustScore", "workloadScore", "maxBatchOrders"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (updates.approvalStatus && !["pending", "approved", "rejected", "suspended"].includes(updates.approvalStatus)) {
    return errorResponse(res, "Invalid rider approval status", 400);
  }
  if (updates.trustScore !== undefined) updates.trustScore = clampScore(updates.trustScore);
  if (updates.isSuspended) updates.isOnline = false;
  if (updates.isSuspended) updates.availabilityStatus = "suspended";
  if (updates.isSuspended === false && !updates.isOnline && updates.approvalStatus !== "rejected") updates.availabilityStatus = "approved_offline";
  if (updates.approvalStatus === "approved" && updates.isSuspended !== true) updates.availabilityStatus = "approved_offline";
  if (updates.approvalStatus === "rejected") updates.availabilityStatus = "pending_approval";

  const rider = await Rider.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("user", "name email phone trustScore isBlocked");
  if (!rider) return errorResponse(res, "Rider not found", 404);
  if (updates.approvalStatus === "approved") await sendRiderApproval(rider);
  await logAction(req, "rider.update", "rider", rider._id, req.body.reason, updates);
  emitRiderRealtime(req, "rider:profile-updated", rider);
  return successResponse(res, "Rider updated", rider);
};

exports.approveRider = (req, res) => {
  req.body.approvalStatus = "approved";
  req.body.isActive = true;
  req.body.isSuspended = false;
  return exports.updateRider(req, res);
};

exports.suspendRider = (req, res) => {
  req.body.approvalStatus = "suspended";
  req.body.isSuspended = true;
  req.body.isOnline = false;
  req.body.isActive = false;
  return exports.updateRider(req, res);
};

exports.listOrders = async (req, res) => {
  const requestedView = req.query.view || "active";
  const view = ["active", "archived", "history", "trash"].includes(requestedView) ? requestedView : "active";
  await applyArchiveWindow(Order);
  const scopedQuery = await enrichOrderSearchQuery({
    query: buildOrderScopeQuery({ view, status: req.query.status, search: req.query.q, from: req.query.from, to: req.query.to }),
    search: req.query.q,
    User,
    Restaurant,
  });
  const { page, limit, skip } = paginationFromQuery(req.query);
  const [orders, total] = await Promise.all([
    Order.find(scopedQuery)
      .populate("customer", "name email phone")
      .populate("restaurant", "name address localArea")
      .populate({ path: "rider", populate: { path: "user", select: "name email phone" } })
      .sort(view === "active" ? { emergencyMode: -1, createdAt: -1 } : { updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(scopedQuery),
  ]);
  return successResponse(res, "Admin orders fetched", {
    orders,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    filters: { view, activeStatuses: ACTIVE_ORDER_STATUSES, historyStatuses: TERMINAL_ORDER_STATUSES },
  });
};

exports.softDeleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (!TERMINAL_ORDER_STATUSES.includes(order.status)) {
    return errorResponse(res, "Only delivered, cancelled, or rejected orders can be moved to trash", 400);
  }
  order.isArchived = true;
  order.archivedAt = order.archivedAt || new Date();
  order.isDeleted = true;
  order.deletedAt = new Date();
  order.deletedBy = req.user._id;
  order.statusTimeline.push({ status: order.status, label: req.body.reason || "Moved to trash by admin", at: new Date() });
  await order.save();
  await logAction(req, "order.soft_delete", "order", order._id, req.body.reason || "Admin moved archived order to trash");
  emitOrderRealtime(req, "admin:order-lifecycle", order, { lifecycleAction: "soft_delete" });
  return successResponse(res, "Order moved to trash", order);
};

exports.restoreOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (!order.isDeleted) return errorResponse(res, "Order is not in trash", 400);
  order.isDeleted = false;
  order.deletedAt = undefined;
  order.deletedBy = undefined;
  order.isArchived = true;
  order.archivedAt = order.archivedAt || new Date();
  order.statusTimeline.push({ status: order.status, label: req.body.reason || "Restored from trash by admin", at: new Date() });
  await order.save();
  await logAction(req, "order.restore", "order", order._id, req.body.reason || "Admin restored order from trash");
  emitOrderRealtime(req, "admin:order-lifecycle", order, { lifecycleAction: "restore" });
  return successResponse(res, "Order restored to archive", order);
};

exports.permanentlyDeleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (!order.isDeleted) return errorResponse(res, "Move the order to trash before permanent deletion", 400);
  await logAction(req, "order.permanent_delete", "order", order._id, req.body?.reason || "Admin permanently deleted order", {
    status: order.status,
    deletedAt: order.deletedAt,
  });
  await order.deleteOne();
  emitAdminRealtime(req, "admin:order-lifecycle", { orderId: req.params.id, lifecycleAction: "permanent_delete" });
  return successResponse(res, "Order permanently deleted", { id: req.params.id });
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
    if (rider.isSuspended || rider.isActive === false || rider.approvalStatus !== "approved") {
      return errorResponse(res, "Rider is not approved for assignment", 400);
    }
    updates.rider = rider._id;
  }

  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (order.isDeleted) return errorResponse(res, "Restore the order before changing status or assignment", 400);
  Object.assign(order, updates);
  if (updates.rider && ["ready", "accepted", "preparing"].includes(order.status)) {
    order.status = "assigned";
    updates.status = "assigned";
    order.assignedAt = new Date();
  }
  if (updates.status) {
    order.statusTimeline.push({ status: updates.status, label: req.body.reason || `Admin forced status ${updates.status}`, at: new Date() });
    if (updates.status === "cancelled") order.paymentStatus = "failed";
    markArchivedIfTerminal(order);
  }
  await order.save();
  if (updates.rider) {
    await Rider.findByIdAndUpdate(updates.rider, {
      $addToSet: { activeOrders: order._id },
      $set: { activeOrder: order._id, availabilityStatus: "busy" },
    });
  }
  if (updates.status === "delivered") {
    await settleCodDelivery(order);
    await order.save();
  }
  await logAction(req, "order.update", "order", order._id, req.body.reason, updates);
  const realtimeOrder = await Order.findById(order._id)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name email phone" } });
  emitOrderRealtime(req, "order-status-updated", realtimeOrder);
  if (updates.rider) emitOrderRealtime(req, "rider:order-assigned", realtimeOrder);
  if (updates.status === "ready") emitOrderRealtime(req, "rider:new-ready-order", realtimeOrder);
  if (updates.status) {
    const populated = await Order.findById(order._id).populate("customer", "name email").populate("restaurant", "name");
    await sendOrderUpdate(populated, `Order ${updates.status}`, `Your SmartFood Narowal order is now ${updates.status}.`);
  }
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
  emitAdminRealtime(req, "admin:complaint-updated", { complaint });
  return successResponse(res, "Complaint updated", complaint);
};

exports.listPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate("order user restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name email phone" } })
    .sort("-createdAt");
  return successResponse(res, "Admin payments fetched", payments);
};

exports.refundPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return errorResponse(res, "Payment not found", 404);
  const order = await Order.findById(payment.order);
  if (req.body.approved) {
    payment.status = "refunded";
    payment.refundStatus = "refunded";
    payment.refundAmount = Number(req.body.amount || payment.refundAmount || payment.amount || 0);
    payment.refundReason = req.body.reason || "Admin approved refund";
    payment.refundedAt = new Date();
    if (order) {
      order.paymentStatus = "refunded";
      order.refundStatus = "refunded";
      order.refundAmount = payment.refundAmount;
      order.refundReason = payment.refundReason;
      order.refundedAt = new Date();
      await order.save();
    }
  } else {
    payment.refundStatus = "rejected";
    payment.refundReason = req.body.reason || "Admin rejected refund";
    if (order) {
      order.refundStatus = "rejected";
      order.refundReason = payment.refundReason;
      if (order.paymentStatus === "refund_pending") order.paymentStatus = order.financialSettled ? "cash_collected" : "pending";
      await order.save();
    }
  }
  await payment.save();
  await logAction(req, req.body.approved ? "payment.refund.approve" : "payment.refund.reject", "payment", payment._id, req.body.reason);
  emitAdminRealtime(req, "admin:refund-updated", { payment, order });
  if (order) emitOrderRealtime(req, "payment:refund-updated", order, { payment });
  return successResponse(res, "Refund decision saved", payment);
};

exports.financialSummary = async (req, res) => {
  const [orders, payments, riders, restaurants] = await Promise.all([
    Order.find(),
    Payment.find(),
    Rider.find().populate("user", "name email phone"),
    Restaurant.find().populate("owner", "name email phone"),
  ]);

  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const totals = {
    grossOrderValue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    collectedCod: orders.reduce((sum, order) => sum + Number(order.cashCollectedAmount || 0), 0),
    platformCommission: orders.reduce((sum, order) => sum + Number(order.platformCommission || 0), 0),
    platformEarnings: orders.reduce((sum, order) => sum + Number(order.platformEarning || 0), 0),
    restaurantRevenue: orders.reduce((sum, order) => sum + Number(order.restaurantRevenue || 0), 0),
    riderEarnings: orders.reduce((sum, order) => sum + Number(order.riderEarning || 0), 0),
    pendingRestaurantSettlement: restaurants.reduce((sum, restaurant) => sum + Number(restaurant.pendingSettlement || 0), 0),
    pendingRiderPayout: riders.reduce((sum, rider) => sum + Number(rider.pendingPayout || 0), 0),
    refunds: payments.reduce((sum, payment) => sum + Number(payment.refundAmount || 0), 0),
    deliveredOrders: deliveredOrders.length,
  };

  return successResponse(res, "Financial summary fetched", { totals, riders, restaurants, payments });
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
