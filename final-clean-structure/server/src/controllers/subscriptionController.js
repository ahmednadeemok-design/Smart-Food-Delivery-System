const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createSubscription = async (req, res) => {
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan: req.body.plan || "monthly",
      price: req.body.price || 999,
      benefits: ["Free delivery", "Special discounts"],
      expiryDate,
    });

    await User.findByIdAndUpdate(req.user._id, {
      subscription: { isActive: true, expiryDate },
    });

    return successResponse(res, "Subscription activated", subscription, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getMySubscription = async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id, isActive: true });
  return successResponse(res, "Subscription fetched", subscription);
};
