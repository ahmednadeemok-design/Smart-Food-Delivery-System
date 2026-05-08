const mongoose = require("mongoose");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Rider = require("../models/Rider");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const { successResponse } = require("../utils/apiResponse");

exports.getSystemHealth = async (req, res) => {
  const [
    users,
    restaurants,
    foodItems,
    orders,
    riders,
    complaints,
    payments,
    subscriptions,
    openComplaints,
    onlineRiders,
    revenue,
    activeOrders,
    pendingRestaurants,
    pendingRiders,
  ] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    FoodItem.countDocuments(),
    Order.countDocuments(),
    Rider.countDocuments(),
    Complaint.countDocuments(),
    Payment.countDocuments(),
    Subscription.countDocuments(),
    Complaint.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    Rider.countDocuments({ isOnline: true }),
    Payment.aggregate([{ $match: { status: { $in: ["paid", "pending"] } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Order.countDocuments({ status: { $in: ["pending", "accepted", "preparing", "ready", "picked"] } }),
    Restaurant.countDocuments({ approvalStatus: "pending" }),
    Rider.countDocuments({ approvalStatus: "pending" }),
  ]);

  return successResponse(res, "System health fetched", {
    api: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    collections: { users, restaurants, foodItems, orders, riders, complaints, payments, subscriptions },
    signals: {
      openComplaints,
      onlineRiders,
      activeOrders,
      pendingApprovals: pendingRestaurants + pendingRiders,
      pendingRestaurants,
      pendingRiders,
      revenuePkr: revenue[0]?.total || 0,
      narowalZones: ["UET Narowal Campus", "Railway Road", "Zafarwal Road", "Circular Road", "Main Bazaar", "Shakargarh Road", "New Lahore Road", "DHQ Hospital Area", "Narowal Railway Station"],
    },
  });
};
