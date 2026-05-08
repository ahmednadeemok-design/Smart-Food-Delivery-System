const Complaint = require("../models/Complaint");
const Order = require("../models/Order");
const { resolveComplaint } = require("../services/complaintResolverService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createComplaint = async (req, res) => {
  try {
    const order = await Order.findById(req.body.order);
    if (!order) return errorResponse(res, "Order not found for complaint", 404);
    if (String(order.customer) !== String(req.user._id)) {
      return errorResponse(res, "Not allowed to complain on another customer's order", 403);
    }

    const ai = resolveComplaint({
      complaintType: req.body.type,
      orderStatus: order.status,
      freshnessScore: order.freshnessScore,
    });

    const complaint = await Complaint.create({
      order: order._id,
      type: req.body.type,
      description: req.body.description,
      evidenceImage: req.body.evidenceImage,
      customer: req.user._id,
      restaurant: order.restaurant,
      rider: order.rider,
      aiDecision: ai.decision,
      compensation: ai.compensation,
    });

    return successResponse(res, "Complaint submitted successfully", complaint, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getComplaints = async (req, res) => {
  const complaints = await Complaint.find()
    .populate("order customer restaurant")
    .populate({ path: "rider", populate: { path: "user", select: "name phone email" } })
    .sort("-createdAt");
  return successResponse(res, "Complaints fetched successfully", complaints);
};

exports.updateComplaintStatus = async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!complaint) return errorResponse(res, "Complaint not found", 404);
  return successResponse(res, "Complaint updated", complaint);
};
