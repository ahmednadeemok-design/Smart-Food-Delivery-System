const mongoose = require("mongoose");

const payoutRequestSchema = new mongoose.Schema(
  {
    requesterType: { type: String, enum: ["rider", "restaurant"], required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "PKR" },
    status: { type: String, enum: ["pending", "processing", "completed", "failed", "rejected"], default: "pending", index: true },
    payoutMethod: String,
    accountTitle: String,
    accountLast4: String,
    ibanLast4: String,
    notes: String,
    adminNotes: String,
    failureReason: String,
    requestedAt: { type: Date, default: Date.now },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

payoutRequestSchema.index({ requesterType: 1, status: 1, createdAt: -1 });
payoutRequestSchema.index({ rider: 1, createdAt: -1 });
payoutRequestSchema.index({ restaurant: 1, createdAt: -1 });

module.exports = mongoose.model("PayoutRequest", payoutRequestSchema);
