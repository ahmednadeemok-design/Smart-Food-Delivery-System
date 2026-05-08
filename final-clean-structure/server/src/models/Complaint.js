const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    type: {
      type: String,
      enum: ["late_delivery", "missing_item", "wrong_item", "bad_quality", "payment_issue", "other"],
      required: true,
    },
    description: String,
    evidenceImage: String,
    status: { type: String, enum: ["open", "reviewing", "resolved", "rejected"], default: "open" },
    aiDecision: String,
    compensation: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
