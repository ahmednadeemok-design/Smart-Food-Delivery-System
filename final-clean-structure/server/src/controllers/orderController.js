const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
const Payment = require("../models/Payment");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { createDeliveryOTP, verifyOTP } = require("../services/otpService");
const { assignBestRider } = require("../services/riderAssignmentService");
const { getDeliveryCostBreakdown } = require("../services/deliveryCostService");

exports.createOrder = async (req, res) => {
  try {
    const { restaurant, items, deliveryAddress, deliveryLocation, paymentMethod, emergencyMode } = req.body;

    if (!restaurant || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return errorResponse(res, "Restaurant, items, and delivery address are required", 400);
    }
    if (deliveryAddress.trim().length < 10) {
      return errorResponse(res, "Please provide a complete Narowal delivery address", 400);
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
      };
    });

    const subtotal = preparedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cost = getDeliveryCostBreakdown({ distanceKm: req.body.distanceKm || 3 });
    const platformFee = Math.max(25, Math.round(subtotal * 0.03));
    const serviceFee = 15;
    const totalAmount = subtotal + cost.total + platformFee + serviceFee;

    const rider = await assignBestRider(deliveryLocation);

    const order = await Order.create({
      customer: req.user._id,
      restaurant,
      rider: rider?._id,
      items: preparedItems,
      deliveryAddress,
      deliveryLocation,
      paymentMethod,
      subtotal,
      deliveryFee: cost.total,
      platformFee,
      serviceFee,
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

  const orders = await Order.find(query).populate("restaurant rider").sort("-createdAt");
  return successResponse(res, "Orders fetched successfully", orders);
};

exports.cancelMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (String(order.customer) !== String(req.user._id)) return errorResponse(res, "Not allowed to cancel another customer's order", 403);
  if (!["pending", "accepted"].includes(order.status)) {
    return errorResponse(res, "Order can only be cancelled before preparation starts", 400);
  }

  order.status = "cancelled";
  order.paymentStatus = order.paymentMethod === "cod" ? "failed" : "refunded";
  order.statusTimeline.push({ status: "cancelled", label: req.body.reason || "Cancelled by customer before preparation", at: new Date() });
  await order.save();

  return successResponse(res, "Order cancelled successfully", order);
};

exports.updateOrderStatus = async (req, res) => {
  const allowedStatuses = ["pending", "accepted", "preparing", "ready", "picked", "delivered", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) return errorResponse(res, "Invalid order status", 400);

  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (req.user.role === "restaurant") {
    const ownsRestaurant = await Restaurant.exists({ _id: order.restaurant, owner: req.user._id });
    if (!ownsRestaurant) return errorResponse(res, "Not allowed to update another restaurant's order", 403);
  }
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider) !== String(rider._id)) return errorResponse(res, "Not allowed to update an unassigned order", 403);
  }
  order.status = req.body.status;
  order.statusTimeline.push({
    status: req.body.status,
    label: req.body.label || `Order marked ${req.body.status}`,
    at: new Date(),
  });
  if (req.body.status === "delivered") order.deliveredAt = new Date();
  await order.save();
  return successResponse(res, "Order status updated", order);
};

exports.getAvailableOrders = async (req, res) => {
  const orders = await Order.find({
    status: { $in: ["pending", "ready"] },
    rider: { $exists: false },
  }).populate("restaurant customer", "name address location").sort({ emergencyMode: -1, createdAt: 1 });

  return successResponse(res, "Available orders fetched successfully", orders);
};

exports.acceptOrder = async (req, res) => {
  const rider = await Rider.findOne({ user: req.user._id });
  if (!rider) return errorResponse(res, "Rider profile not found", 404);
  if (rider.isSuspended || rider.isActive === false || rider.approvalStatus === "rejected") {
    return errorResponse(res, "Rider is not approved for deliveries", 403);
  }

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: { $in: ["pending", "ready"] }, rider: { $exists: false } },
    { rider: rider._id, status: "accepted" },
    { new: true }
  );

  if (!order) return errorResponse(res, "Order is not available", 400);

  if (!rider.activeOrders.some((id) => String(id) === String(order._id))) {
    rider.activeOrders.push(order._id);
    await rider.save();
  }

  return successResponse(res, "Order accepted successfully", order);
};

exports.verifyDelivery = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (req.user.role === "customer" && String(order.customer) !== String(req.user._id)) {
    return errorResponse(res, "Not allowed to verify another customer's delivery", 403);
  }
  if (req.user.role === "rider") {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider || String(order.rider) !== String(rider._id)) return errorResponse(res, "Not allowed to verify an unassigned delivery", 403);
  }

  if (!verifyOTP(order.otp, req.body.otp)) return errorResponse(res, "Invalid delivery OTP", 400);

  order.status = "delivered";
  order.deliveredAt = new Date();
  order.statusTimeline.push({ status: "delivered", label: "Delivery completed with OTP", at: new Date() });
  await order.save();

  return successResponse(res, "Delivery verified successfully", order);
};
