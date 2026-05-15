const mongoose = require("mongoose");

const financeTransactionSchema = new mongoose.Schema(
  {
    referenceKey: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        "order_reserved",
        "cod_collected",
        "rider_earning",
        "restaurant_settlement",
        "platform_earning",
        "refund_liability",
        "payout_requested",
        "payout_completed",
        "payout_failed",
        "payout_rejected",
        "adjustment",
      ],
      required: true,
    },
    status: { type: String, enum: ["pending", "reserved", "posted", "reversed", "failed"], default: "posted" },
    direction: { type: String, enum: ["credit", "debit", "neutral"], default: "neutral" },
    actorType: { type: String, enum: ["platform", "customer", "rider", "restaurant", "admin"], required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, refPath: "actorModel" },
    actorModel: { type: String, enum: ["User", "Rider", "Restaurant"] },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    payoutRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PayoutRequest" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },
    balanceImpact: {
      platformEarning: { type: Number, default: 0 },
      restaurantLiability: { type: Number, default: 0 },
      riderLiability: { type: Number, default: 0 },
      codInCirculation: { type: Number, default: 0 },
      refundLiability: { type: Number, default: 0 },
    },
    metadata: { type: Object, default: {} },
    note: String,
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

financeTransactionSchema.index({ actorType: 1, actor: 1, createdAt: -1 });
financeTransactionSchema.index({ order: 1, type: 1 });
financeTransactionSchema.index({ restaurant: 1, createdAt: -1 });
financeTransactionSchema.index({ rider: 1, createdAt: -1 });

module.exports = mongoose.model("FinanceTransaction", financeTransactionSchema);
