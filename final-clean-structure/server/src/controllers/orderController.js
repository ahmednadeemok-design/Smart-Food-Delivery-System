const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");
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

    const foodIds = items.map((i) => i.foodItem);
    const foodItems = await FoodItem.find({ _id: { $in: foodIds } });

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
    const totalAmount = subtotal + cost.total;

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
      totalAmount,
      emergencyMode: Boolean(emergencyMode),
      otp: createDeliveryOTP(),
      estimatedDeliveryTime: emergencyMode ? 15 : 35,
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

exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return errorResponse(res, "Order not found", 404);
  return successResponse(res, "Order status updated", order);
};

exports.verifyDelivery = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return errorResponse(res, "Order not found", 404);

  if (!verifyOTP(order.otp, req.body.otp)) return errorResponse(res, "Invalid delivery OTP", 400);

  order.status = "delivered";
  order.deliveredAt = new Date();
  await order.save();

  return successResponse(res, "Delivery verified successfully", order);
};
