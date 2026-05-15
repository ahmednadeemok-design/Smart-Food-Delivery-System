const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Payment = require("../models/Payment");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { createDeliveryOTP, verifyOTP } = require("../services/otpService");
const { getDeliveryCostBreakdown } = require("../services/deliveryCostService");
const { calculateOrderFinancials, recordOrderReserved, settleCodDelivery } = require("../services/financeService");
const { calculateCouponDiscount, clampLocation, isNarowalAddress } = require("../constants/narowal");
const { sendOrderUpdate } = require("../utils/emailService");
const { createNotification, notifyOrderParticipants } = require("../services/notificationService");
const { emitOrderRealtime, emitRiderRealtime } = require("../services/realtimeService");
const { sanitizeOrderForRole, sanitizeOrdersForRole } = require("../services/contactPrivacyService");
const {
  ACTIVE_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  applyArchiveWindow,
  buildOrderScopeQuery,
  enrichOrderSearchQuery,
  markArchivedIfTerminal,
  paginationFromQuery,
} = require("../services/orderLifecycleService");

const emitOrderUpdate = (req, order, event = "order-status-updated") => {
  const io = req.app.get("io");
  if (!io || !order?._id) return;
  io.to(`order:${order._id}`).emit(event, { orderId: order._id, status: order.status, order });
  emitOrderRealtime(req, event, order);
};

exports.createOrder = async (req, res) => {
  try {
    const { restaurant, items, deliveryAddress, deliveryLocation, paymentMethod = "cod", emergencyMode, couponCode } = req.body;
    const supportedPayments = ["cod", "jazzcash", "easypaisa", "card", "stripe", "wallet"];
    if (!supportedPayments.includes(paymentMethod)) return errorResponse(res, "Unsupported payment method", 400);

    if (!restaurant || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return errorResponse(res, "Restaurant, items, and delivery address are required", 400);
    }
    if (deliveryAddress.trim().length < 10) {
      return errorResponse(res, "Please provide a complete Narowal delivery address", 400);
    }
    if (!isNarowalAddress(deliveryAddress)) {
      return errorResponse(res, "SmartFood only delivers to supported Narowal city areas", 400);
    }
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) return errorResponse(res, "Restaurant not found", 404);
    if (restaurantDoc.approvalStatus && restaurantDoc.approvalStatus !== "approved") {
      return errorResponse(res, "This restaurant is not accepting orders yet", 400);
    }
    if (restaurantDoc.isActive === false || restaurantDoc.isOpen === false) {
      return errorResponse(res, "This restaurant is currently closed", 400);
    }

    const foodIds = items.map((i) => i.foodItem);
    const foodItems = await FoodItem.find({ _id: { $in: foodIds } });
    if (foodItems.length !== foodIds.length) return errorResponse(res, "One or more food items were not found", 400);
    if (foodItems.some((item) => String(item.restaurant) !== String(restaurant))) {
      return errorResponse(res, "All items must belong to the selected restaurant", 400);
    }
    if (foodItems.some((item) => item.isAvailable === false || item.isOutOfStock === true)) {
      return errorResponse(res, "One or more selected items are currently unavailable", 400);
    }

    const preparedItems = items.map((i) => {
      const found = foodItems.find((f) => String(f._id) === String(i.foodItem));
      return {
        foodItem: i.foodItem,
        name: found?.name,
        price: found?.price || 0,
        quantity: i.quantity || 1,
        calories: found?.calories || 0,
        addOns: Array.isArray(i.addOns) ? i.addOns.map((addOn) => ({ name: addOn.name, price: Number(addOn.price || 0) })) : [],
        options: Array.isArray(i.options) ? i.options.map((option) => ({ name: option.name, value: option.value })) : [],
      };
    });

    const subtotal = preparedItems.reduce((sum, item) => {
      const addOnTotal = (item.addOns || []).reduce((addOnSum, addOn) => addOnSum + Number(addOn.price || 0), 0);
      return sum + (item.price + addOnTotal) * item.quantity;
    }, 0);
    const cost = getDeliveryCostBreakdown({ distanceKm: req.body.distanceKm || 3 });
    const platformFee = Math.max(25, Math.round(subtotal * 0.03));
    const serviceFee = 15;
    const coupon = calculateCouponDiscount({ code: couponCode, subtotal, deliveryAddress });
    if (couponCode && !coupon.discount) return errorResponse(res, coupon.message || "Coupon could not be applied", 400);
    const loyaltyPointsRedeemed = Math.min(Number(req.body.loyaltyPointsRedeemed || 0), req.user.loyalty?.points || 0, Math.floor(subtotal * 0.15));
    const taxAmount = 0;
    const discountAmount = coupon.discount + loyaltyPointsRedeemed;
    const financials = calculateOrderFinancials({
      subtotal,
      deliveryFee: cost.total,
      platformFee,
      serviceFee,
      discountAmount,
      taxAmount,
    });
    const totalAmount = financials.totalAmount;
    const loyaltyPointsEarned = Math.floor(totalAmount / 100);

    const order = await Order.create({
      customer: req.user._id,
      restaurant,
      items: preparedItems,
      deliveryAddress,
      deliveryLocation: clampLocation(deliveryLocation),
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid_online",
      subtotal,
      deliveryFee: cost.total,
      platformFee,
      serviceFee,
      discount: coupon.discount,
      discountAmount,
      taxAmount,
      platformCommission: financials.platformCommission,
      restaurantRevenue: financials.restaurantRevenue,
      riderEarning: financials.riderEarning,
      platformEarning: financials.platformEarning,
      couponCode: coupon.code,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      totalAmount,
      emergencyMode: Boolean(emergencyMode),
      otp: createDeliveryOTP(),
      estimatedDeliveryTime: emergencyMode ? 15 : 35,
      statusTimeline: [{ status: "pending", label: "Order placed by customer" }],
    });
    order.deliveryOtp = order.otp;
    await order.save({ validateBeforeSave: false });

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: totalAmount,
      method: paymentMethod || "cod",
      status: paymentMethod === "cod" ? "pending" : "paid_online",
      restaurant,
      subtotal: financials.subtotal,
      deliveryFee: financials.deliveryFee,
      platformFee: financials.platformFee,
      serviceFee: financials.serviceFee,
      discountAmount: financials.discountAmount,
      taxAmount: financials.taxAmount,
      platformCommission: financials.platformCommission,
      restaurantRevenue: financials.restaurantRevenue,
      riderEarning: financials.riderEarning,
    });
    await recordOrderReserved(order, payment);

    req.user.loyalty = req.user.loyalty || {};
    req.user.loyalty.points = Math.max(0, Number(req.user.loyalty.points || 0) - loyaltyPointsRedeemed + loyaltyPointsEarned);
    req.user.loyalty.redeemedPoints = Number(req.user.loyalty.redeemedPoints || 0) + loyaltyPointsRedeemed;
    req.user.loyalty.badge = req.user.loyalty.points >= 900 ? "Gold" : req.user.loyalty.points >= 350 ? "Silver" : "Bronze";
    req.user.lastOrderAt = new Date();
    await req.user.save();

    await FoodItem.updateMany({ _id: { $in: foodIds } }, { $inc: { soldCount: 1 } });
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phone")
      .populate("restaurant")
      .populate({ path: "rider", populate: { path: "user", select: "name phone email" } });
    emitOrderUpdate(req, populatedOrder, "order-created");
    emitOrderRealtime(req, "restaurant:new-order", populatedOrder);
    emitOrderRealtime(req, "customer:order-placed", populatedOrder);
    await sendOrderUpdate({ ...order.toObject(), customer: req.user }, "Order placed", "Your SmartFood Narowal order has been placed successfully.");
    const orderRestaurant = await Restaurant.findById(restaurant).select("owner name");
    await Promise.all([
      createNotification({ user: req.user._id, type: "order", title: "Order placed", message: "Your SmartFood Narowal COD order has been placed.", order: order._id, restaurant }),
      orderRestaurant?.owner
        ? createNotification({ user: orderRestaurant.owner, type: "order", title: "New restaurant order", message: `A new order is waiting at ${orderRestaurant.name}.`, order: order._id, restaurant })
        : null,
    ]);

    return successResponse(res, "Order created successfully", sanitizeOrderForRole(populatedOrder, req), 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getMyOrders = async (req, res) => {
  let query = { customer: req.user._id };

  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    query = rider ? { rider: rider._id } : { _id: null };
  }

  if (req.user.role === "restaurant") {
    const restaurants = await Restaurant.find({ owner: req.user._id }).select("_id");
    query = restaurants.length ? { restaurant: { $in: restaurants.map((restaurant) => restaurant._id) } } : { _id: null };
  }

  await applyArchiveWindow(Order, query);
  const requestedView = req.query.view || "history";
  const view = ["active", "history", "archived"].includes(requestedView) ? requestedView : "history";
  const scopedQuery = await enrichOrderSearchQuery({
    query: { ...query, ...buildOrderScopeQuery({ view, status: req.query.status, search: req.query.q, from: req.query.from, to: req.query.to }) },
    search: req.query.q,
    User: require("../models/User"),
    Restaurant,
  });
  if (req.user.role === "customer") scopedQuery.hiddenForCustomers = { $ne: req.user._id };
  const { page, limit, skip } = paginationFromQuery(req.query);
  const [orders, total] = await Promise.all([
    Order.find(scopedQuery)
      .populate("customer", "name email phone")
      .populate("restaurant")
      .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
      .sort(view === "active" ? { createdAt: -1 } : { updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(scopedQuery),
  ]);
  return successResponse(res, "Orders fetched successfully", {
    orders: sanitizeOrdersForRole(orders, req),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    filters: { view, activeStatuses: ACTIVE_ORDER_STATUSES, historyStatuses: TERMINAL_ORDER_STATUSES },
  });
};

exports.hideMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (order.isDeleted && req.user.role !== "admin") return errorResponse(res, "Order not found", 404);
  if (String(order.customer) !== String(req.user._id)) return errorResponse(res, "Not allowed to hide another customer's order", 403);
  if (!TERMINAL_ORDER_STATUSES.includes(order.status)) return errorResponse(res, "Only completed, cancelled, or rejected orders can be hidden", 400);
  await Order.findByIdAndUpdate(order._id, { $addToSet: { hiddenForCustomers: req.user._id } });
  return successResponse(res, "Order hidden from your history", { id: order._id });
};

exports.getOrderById = async (req, res) => {
  const orderId = req.params.id || req.params.orderId;
  const order = await Order.findById(orderId)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } });
  if (!order) return errorResponse(res, "Order not found", 404);

  if (req.user.role === "customer" && String(order.customer?._id) !== String(req.user._id)) {
    return errorResponse(res, "Not allowed to view another customer's order", 403);
  }
  if (req.user.role === "restaurant") {
    const ownsRestaurant = await Restaurant.exists({ _id: order.restaurant?._id || order.restaurant, owner: req.user._id });
    if (!ownsRestaurant) return errorResponse(res, "Not allowed to view another restaurant's order", 403);
  }
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider?._id || order.rider) !== String(rider._id)) {
      return errorResponse(res, "Not allowed to view an unassigned delivery", 403);
    }
  }

  return successResponse(res, "Order fetched successfully", sanitizeOrderForRole(order, req));
};

exports.cancelMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (String(order.customer) !== String(req.user._id)) return errorResponse(res, "Not allowed to cancel another customer's order", 403);
  if (!["pending", "accepted"].includes(order.status)) {
    return errorResponse(res, "Order can only be cancelled before preparation starts", 400);
  }

  order.status = "cancelled";
  order.paymentStatus = order.paymentMethod === "cod" ? "failed" : "refund_pending";
  order.refundStatus = order.paymentMethod === "cod" ? "none" : "requested";
  markArchivedIfTerminal(order);
  order.statusTimeline.push({ status: "cancelled", label: req.body.reason || "Cancelled by customer before preparation", at: new Date() });
  await order.save();
  const populatedOrder = await Order.findById(order._id)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } });
  emitOrderUpdate(req, populatedOrder);
  emitOrderRealtime(req, "restaurant:order-cancelled", populatedOrder);

  return successResponse(res, "Order cancelled successfully", sanitizeOrderForRole(populatedOrder, req));
};

exports.updateOrderStatus = async (req, res) => {
  const allowedStatuses = ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way", "delivered", "cancelled", "rejected"];
  if (!allowedStatuses.includes(req.body.status)) return errorResponse(res, "Invalid order status", 400);

  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (order.isDeleted) return errorResponse(res, "Order not found", 404);
  if (req.user.role === "restaurant") {
    const ownsRestaurant = await Restaurant.exists({ _id: order.restaurant, owner: req.user._id });
    if (!ownsRestaurant) return errorResponse(res, "Not allowed to update another restaurant's order", 403);
    if (!["accepted", "preparing", "ready", "rejected"].includes(req.body.status)) {
      return errorResponse(res, "Restaurant can only accept, prepare, ready, or reject orders", 403);
    }
    const validTransitions = {
      pending: ["accepted", "rejected"],
      accepted: ["preparing", "rejected"],
      preparing: ["ready", "rejected"],
    };
    if (!(validTransitions[order.status] || []).includes(req.body.status)) {
      return errorResponse(res, `Cannot move order from ${order.status} to ${req.body.status}`, 400);
    }
  }
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider) !== String(rider._id)) return errorResponse(res, "Not allowed to update an unassigned order", 403);
    if (req.body.status !== "picked") return errorResponse(res, "Rider can only mark assigned orders as picked before OTP delivery", 403);
    if (order.status !== "assigned") return errorResponse(res, "Only assigned orders can be picked", 400);
  }
  order.status = req.body.status;
  if (req.body.status === "picked") order.pickedAt = new Date();
  order.statusTimeline.push({
    status: req.body.status,
    label: req.body.label || `Order marked ${req.body.status}`,
    at: new Date(),
  });
  if (req.body.status === "rejected") {
    order.paymentStatus = "failed";
    await Restaurant.findByIdAndUpdate(order.restaurant, { $inc: { cancelledOrders: 1 } });
  }
  if (req.body.status === "delivered") order.deliveredAt = new Date();
  markArchivedIfTerminal(order);
  await order.save();
  if (req.body.status === "delivered" && order.rider) {
    await Rider.findByIdAndUpdate(order.rider, { $pull: { activeOrders: order._id }, $inc: { completedDeliveries: 1 } });
  }
  const populated = await Order.findById(order._id)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } });
  emitOrderUpdate(req, populated);
  if (req.body.status === "ready") emitOrderRealtime(req, "rider:new-ready-order", populated);
  if (req.body.status === "picked") emitOrderRealtime(req, "customer:otp-visible", populated);
  await sendOrderUpdate(populated, `Order ${order.status}`, `Your SmartFood Narowal order is now ${order.status}.`);
  await notifyOrderParticipants(populated, `Order ${order.status}`, `Your SmartFood Narowal order is now ${order.status}.`);
  return successResponse(res, "Order status updated", sanitizeOrderForRole(populated, req));
};

exports.getAvailableOrders = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  const orders = await Order.find({
    status: "ready",
    isArchived: { $ne: true },
    isDeleted: { $ne: true },
    ...(rider ? { rejectedByRiders: { $ne: rider._id } } : {}),
    $or: [{ rider: { $exists: false } }, { rider: null }],
  })
    .populate("restaurant", "name address location phone localArea")
    .populate("customer", "name")
    .sort({ emergencyMode: -1, createdAt: 1 })
    .limit(50);

  return successResponse(res, "Available orders fetched successfully", sanitizeOrdersForRole(orders, req));
};

exports.acceptOrder = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return errorResponse(res, "Complete rider profile before accepting orders.", 400);
  if (rider.isSuspended || rider.isActive === false || rider.approvalStatus !== "approved") {
    return errorResponse(res, "Rider is not approved for deliveries", 403);
  }
  if (!rider.isOnline) return errorResponse(res, "Go online before accepting orders.", 400);
  const busyOrder = await Order.exists({ rider: rider._id, status: { $in: ["assigned", "picked", "on-the-way"] }, isDeleted: { $ne: true } });
  if (busyOrder) return errorResponse(res, "Complete your active delivery before accepting another order.", 400);

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id || req.params.orderId, status: "ready", isDeleted: { $ne: true }, rejectedByRiders: { $ne: rider._id }, $or: [{ rider: { $exists: false } }, { rider: null }] },
    {
      $set: { rider: rider._id, status: "assigned", assignedAt: new Date() },
      $push: { statusTimeline: { status: "assigned", label: "Delivery assigned to rider", at: new Date() } },
    },
    { new: true }
  )
    .populate("restaurant", "name address location phone localArea")
    .populate("customer", "name phone email");

  if (!order) return errorResponse(res, "Order is not available", 400);

  if (!rider.activeOrders.some((id) => String(id) === String(order._id))) {
    rider.activeOrders.push(order._id);
    rider.activeOrder = order._id;
    rider.availabilityStatus = "busy";
    await rider.save();
  }

  emitOrderUpdate(req, order);
  emitOrderRealtime(req, "rider:order-assigned", order);
  emitOrderRealtime(req, "restaurant:rider-assigned", order);
  emitOrderRealtime(req, "rider:ready-order-removed", order);
  emitRiderRealtime(req, "rider:availability-updated", rider);
  const assignedOrder = await Order.findById(order._id).populate("customer", "name email").populate("restaurant", "name");
  await sendOrderUpdate(assignedOrder, "Rider assigned", "A rider has accepted your SmartFood Narowal delivery.");
  await notifyOrderParticipants(
    await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("restaurant", "name owner")
      .populate({ path: "rider", populate: { path: "user", select: "name email" } }),
    "Rider assigned",
    "A rider has accepted this SmartFood Narowal delivery."
  );
  return successResponse(res, "Order accepted successfully", sanitizeOrderForRole(order, req));
};

exports.verifyDelivery = async (req, res) => {
  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (req.user.role !== "rider") return errorResponse(res, "Only the assigned rider can verify delivery OTP", 403);
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider) !== String(rider._id)) return errorResponse(res, "Not allowed to verify an unassigned delivery", 403);
  }

  if (!["assigned", "picked", "on-the-way"].includes(order.status)) return errorResponse(res, "Delivery OTP can only be verified after rider assignment or pickup", 400);
  if (!verifyOTP(order.otp, req.body.otp)) {
    emitOrderRealtime(req, "rider:otp-verification-result", order, { ok: false, message: "Invalid delivery OTP" });
    return errorResponse(res, "Invalid delivery OTP", 400);
  }

  order.status = "delivered";
  order.otpVerified = true;
  order.deliveredAt = new Date();
  markArchivedIfTerminal(order);
  order.statusTimeline.push({ status: "delivered", label: "Delivery completed with OTP", at: new Date() });
  await settleCodDelivery(order);
  await order.save();
  const populatedOrder = await Order.findById(order._id)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } });
  emitOrderUpdate(req, populatedOrder);
  emitOrderRealtime(req, "rider:otp-verification-result", populatedOrder, { ok: true });
  const deliveredOrder = await Order.findById(order._id).populate("customer", "name email").populate("restaurant", "name");
  await sendOrderUpdate(deliveredOrder, "Order delivered", "Your SmartFood Narowal order has been delivered. Thank you!");
  await notifyOrderParticipants(
    await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("restaurant", "name owner")
      .populate({ path: "rider", populate: { path: "user", select: "name email" } }),
    "Order delivered",
    "SmartFood Narowal delivery completed with OTP verification."
  );

  return successResponse(res, "Delivery verified successfully", sanitizeOrderForRole(populatedOrder, req));
};

exports.rejectOrder = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return errorResponse(res, "Complete rider profile before skipping orders.", 400);
  const order = await Order.findOne({ _id: req.params.orderId, status: "ready", $or: [{ rider: { $exists: false } }, { rider: null }] });
  if (!order) return errorResponse(res, "Order is no longer available", 400);

  order.rejectedByRiders = order.rejectedByRiders || [];
  if (!order.rejectedByRiders.some((id) => String(id) === String(rider._id))) {
    order.rejectedByRiders.push(rider._id);
  }
  order.statusTimeline.push({ status: "ready", label: "Delivery skipped by rider", at: new Date() });
  await order.save({ validateBeforeSave: false });

  rider.rejectedOrders = rider.rejectedOrders || [];
  rider.rejectedOrders.push(order._id);
  rider.acceptanceRate = Math.max(0, Number(rider.acceptanceRate || 100) - 2);
  await rider.save();

  return successResponse(res, "Order skipped", { orderId: order._id });
};

exports.markPicked = async (req, res) => {
  req.body.status = "picked";
  return exports.updateOrderStatus(req, res);
};
