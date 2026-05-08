const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cod", "jazzcash", "easypaisa", "card", "stripe", "wallet"], default: "cod" },
    status: {
      type: String,
      enum: ["pending", "cash_collected", "paid_online", "settled_to_restaurant", "rider_pending", "rider_paid", "refund_pending", "refunded", "failed"],
      default: "pending",
    },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    restaurantRevenue: { type: Number, default: 0 },
    riderEarning: { type: Number, default: 0 },
    cashCollectedAmount: { type: Number, default: 0 },
    collectedAt: Date,
    riderPayoutStatus: { type: String, enum: ["pending", "processed", "paid"], default: "pending" },
    restaurantSettlementStatus: { type: String, enum: ["pending", "processed", "paid"], default: "pending" },
    refundStatus: { type: String, enum: ["none", "requested", "under_review", "approved", "rejected", "refunded"], default: "none" },
    refundAmount: { type: Number, default: 0 },
    transactionId: String,
    refundReason: String,
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
