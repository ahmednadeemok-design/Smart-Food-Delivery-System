const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    referenceKey: { type: String, required: true, unique: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    payoutRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PayoutRequest" },
    grossAmount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    refundImpact: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "processing", "paid", "adjusted", "failed"], default: "pending", index: true },
    note: String,
    settledAt: Date,
  },
  { timestamps: true }
);

settlementSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Settlement", settlementSchema);
