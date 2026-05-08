const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Payment = require("../models/Payment");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { createDeliveryOTP, verifyOTP } = require("../services/otpService");
const { getDeliveryCostBreakdown } = require("../services/deliveryCostService");
const { calculateCouponDiscount, clampLocation, isNarowalAddress } = require("../constants/narowal");

const emitOrderUpdate = (req, order, event = "order-status-updated") => {
  const io = req.app.get("io");
  if (!io || !order?._id) return;
  io.emit(event, { orderId: order._id, status: order.status, order });
  io.to(`order:${order._id}`).emit(event, { orderId: order._id, status: order.status, order });
};

exports.createOrder = async (req, res) => {
  try {
    const { restaurant, items, deliveryAddress, deliveryLocation, paymentMethod = "cod", emergencyMode, couponCode } = req.body;

    if (!restaurant || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return errorResponse(res, "Restaurant, items, and delivery address are required", 400);
    }
    if (deliveryAddress.trim().length < 10) {
      return errorResponse(res, "Please provide a complete Narowal delivery address", 400);
    }
    if (!isNarowalAddress(deliveryAddress)) {
      return errorResponse(res, "SmartFood only delivers to supported Narowal city areas", 400);
    }

    const foodIds = items.map((i) => i.foodItem);
    const foodItems = await FoodItem.find({ _id: { $in: foodIds } });
    if (foodItems.length !== foodIds.length) return errorResponse(res, "One or more food items were not found", 400);
    if (foodItems.some((item) => String(item.restaurant) !== String(restaurant))) {
      return errorResponse(res, "All items must belong to the selected restaurant", 400);
    }
    if (foodItems.some((item) => item.isAvailable === false)) {
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
    const totalAmount = Math.max(0, subtotal + cost.total + platformFee + serviceFee - coupon.discount - loyaltyPointsRedeemed);
    const loyaltyPointsEarned = Math.floor(totalAmount / 100);

    const order = await Order.create({
      customer: req.user._id,
      restaurant,
      items: preparedItems,
      deliveryAddress,
      deliveryLocation: clampLocation(deliveryLocation),
      paymentMethod,
      subtotal,
      deliveryFee: cost.total,
      platformFee,
      serviceFee,
      discount: coupon.discount,
      couponCode: coupon.code,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      totalAmount,
      emergencyMode: Boolean(emergencyMode),
      otp: createDeliveryOTP(),
      estimatedDeliveryTime: emergencyMode ? 15 : 35,
      statusTimeline: [{ status: "pending", label: "Order placed by customer" }],
    });

    await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: totalAmount,
      method: paymentMethod || "cod",
      status: paymentMethod === "cod" ? "pending" : "paid",
    });

    req.user.loyalty = req.user.loyalty || {};
    req.user.loyalty.points = Math.max(0, Number(req.user.loyalty.points || 0) - loyaltyPointsRedeemed + loyaltyPointsEarned);
    req.user.loyalty.redeemedPoints = Number(req.user.loyalty.redeemedPoints || 0) + loyaltyPointsRedeemed;
    req.user.loyalty.badge = req.user.loyalty.points >= 900 ? "Gold" : req.user.loyalty.points >= 350 ? "Silver" : "Bronze";
    req.user.lastOrderAt = new Date();
    await req.user.save();

    await FoodItem.updateMany({ _id: { $in: foodIds } }, { $inc: { soldCount: 1 } });
    emitOrderUpdate(req, order, "order-created");

    return successResponse(res, "Order created successfully", order, 201);
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

  const orders = await Order.find(query)
    .populate("customer", "name email phone")
    .populate("restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
    .sort("-createdAt");
  return successResponse(res, "Orders fetched successfully", orders);
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

  return successResponse(res, "Order fetched successfully", order);
};

exports.cancelMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (String(order.customer) !== String(req.user._id)) return errorResponse(res, "Not allowed to cancel another customer's order", 403);
  if (!["pending", "accepted"].includes(order.status)) {
    return errorResponse(res, "Order can only be cancelled before preparation starts", 400);
  }

  order.status = "cancelled";
  order.paymentStatus = order.paymentMethod === "cod" ? "failed" : "refunded";
  order.statusTimeline.push({ status: "cancelled", label: req.body.reason || "Cancelled by customer before preparation", at: new Date() });
  await order.save();
  emitOrderUpdate(req, order);

  return successResponse(res, "Order cancelled successfully", order);
};

exports.updateOrderStatus = async (req, res) => {
  const allowedStatuses = ["pending", "accepted", "preparing", "ready", "assigned", "picked", "delivered", "cancelled", "rejected"];
  if (!allowedStatuses.includes(req.body.status)) return errorResponse(res, "Invalid order status", 400);

  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
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
  order.statusTimeline.push({
    status: req.body.status,
    label: req.body.label || `Order marked ${req.body.status}`,
    at: new Date(),
  });
  if (req.body.status === "rejected") order.paymentStatus = "failed";
  if (req.body.status === "delivered") order.deliveredAt = new Date();
  await order.save();
  if (req.body.status === "delivered" && order.rider) {
    await Rider.findByIdAndUpdate(order.rider, { $pull: { activeOrders: order._id }, $inc: { completedDeliveries: 1 } });
  }
  emitOrderUpdate(req, order);
  return successResponse(res, "Order status updated", order);
};

exports.getAvailableOrders = async (req, res) => {
  const orders = await Order.find({
    status: "ready",
    $or: [{ rider: { $exists: false } }, { rider: null }],
  }).populate("restaurant customer", "name address location phone").sort({ emergencyMode: -1, createdAt: 1 });

  return successResponse(res, "Available orders fetched successfully", orders);
};

exports.acceptOrder = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return errorResponse(res, "Complete rider profile before accepting orders.", 400);
  if (rider.isSuspended || rider.isActive === false || rider.approvalStatus !== "approved") {
    return errorResponse(res, "Rider is not approved for deliveries", 403);
  }
  if (!rider.isOnline) return errorResponse(res, "Go online before accepting orders.", 400);
  const busyOrder = await Order.exists({ rider: rider._id, status: { $in: ["assigned", "picked"] } });
  if (busyOrder) return errorResponse(res, "Complete your active delivery before accepting another order.", 400);

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id || req.params.orderId, status: "ready", $or: [{ rider: { $exists: false } }, { rider: null }] },
    {
      $set: { rider: rider._id, status: "assigned" },
      $push: { statusTimeline: { status: "assigned", label: "Delivery assigned to rider", at: new Date() } },
    },
    { new: true }
  ).populate("restaurant customer", "name address location phone");

  if (!order) return errorResponse(res, "Order is not available", 400);

  if (!rider.activeOrders.some((id) => String(id) === String(order._id))) {
    rider.activeOrders.push(order._id);
    rider.availabilityStatus = "busy";
    await rider.save();
  }

  emitOrderUpdate(req, order);
  return successResponse(res, "Order accepted successfully", order);
};

exports.verifyDelivery = async (req, res) => {
  const order = await Order.findById(req.params.id || req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (req.user.role !== "rider") return errorResponse(res, "Only the assigned rider can verify delivery OTP", 403);
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider) !== String(rider._id)) return errorResponse(res, "Not allowed to verify an unassigned delivery", 403);
  }

  if (!["assigned", "picked"].includes(order.status)) return errorResponse(res, "Delivery OTP can only be verified after rider assignment or pickup", 400);
  if (!verifyOTP(order.otp, req.body.otp)) return errorResponse(res, "Invalid delivery OTP", 400);

  order.status = "delivered";
  order.deliveredAt = new Date();
  order.statusTimeline.push({ status: "delivered", label: "Delivery completed with OTP", at: new Date() });
  await order.save();
  if (order.rider) {
    const riderPayout = Math.max(80, Math.round(Number(order.deliveryFee || 0) * 0.8));
    await Rider.findByIdAndUpdate(order.rider, {
      $pull: { activeOrders: order._id },
      $inc: { completedDeliveries: 1, earnings: riderPayout, dailyEarnings: riderPayout, weeklyEarnings: riderPayout },
    });
  }
  await Rider.findByIdAndUpdate(order.rider, { availabilityStatus: "online", isOnline: true });
  await Restaurant.findByIdAndUpdate(order.restaurant, { $inc: { totalSales: order.totalAmount || 0, completedOrders: 1 } });
  emitOrderUpdate(req, order);

  return successResponse(res, "Delivery verified successfully", order);
};
