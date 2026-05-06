const Payment = require("../models/Payment");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, user: req.user._id });
    return successResponse(res, "Payment record created", payment, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getPayments = async (req, res) => {
  const payments = await Payment.find().populate("order user").sort("-createdAt");
  return successResponse(res, "Payments fetched", payments);
};
