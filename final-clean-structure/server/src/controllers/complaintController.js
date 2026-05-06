const Complaint = require("../models/Complaint");
const { resolveComplaint } = require("../services/complaintResolverService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

exports.createComplaint = async (req, res) => {
  try {
    const ai = resolveComplaint({
      complaintType: req.body.type,
      orderStatus: req.body.orderStatus,
      freshnessScore: req.body.freshnessScore,
    });

    const complaint = await Complaint.create({
      ...req.body,
      customer: req.user._id,
      aiDecision: ai.decision,
      compensation: ai.compensation,
    });

    return successResponse(res, "Complaint submitted successfully", complaint, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getComplaints = async (req, res) => {
  const complaints = await Complaint.find().populate("order customer").sort("-createdAt");
  return successResponse(res, "Complaints fetched successfully", complaints);
};

exports.updateComplaintStatus = async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!complaint) return errorResponse(res, "Complaint not found", 404);
  return successResponse(res, "Complaint updated", complaint);
};
