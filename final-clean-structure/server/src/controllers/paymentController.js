const Payment = require("../models/Payment");
const Order = require("../models/Order");
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
  const payments = await Payment.find()
    .populate("order user restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
    .sort("-createdAt");
  return successResponse(res, "Payments fetched", payments);
};

exports.requestRefund = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return errorResponse(res, "Order not found", 404);
  if (String(order.customer) !== String(req.user._id)) return errorResponse(res, "Not allowed to request refund for this order", 403);
  if (!["delivered", "cancelled"].includes(order.status)) return errorResponse(res, "Refund can be requested after delivery or cancellation", 400);

  const amount = Math.min(Number(req.body.amount || order.totalAmount || 0), order.totalAmount || 0);
  order.refundStatus = "requested";
  order.refundReason = req.body.reason || "Customer requested refund";
  order.refundAmount = amount;
  order.refundRequestedAt = new Date();
  order.paymentStatus = "refund_pending";
  await order.save();

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      refundStatus: "requested",
      refundAmount: amount,
      refundReason: order.refundReason,
      status: "refund_pending",
    },
    { new: true }
  );

  return successResponse(res, "Refund request submitted", { order, payment });
};
