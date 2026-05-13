const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    foodItem: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    calories: Number,
    addOns: [{ name: String, price: Number }],
    options: [{ name: String, value: String }],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    rejectedByRiders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rider" }],
    items: [orderItemSchema],
    deliveryAddress: { type: String, required: true },
    deliveryLocation: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way", "delivered", "cancelled", "rejected"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cod", "jazzcash", "easypaisa", "card", "stripe", "wallet"], default: "cod" },
    paymentStatus: {
      type: String,
      enum: ["pending", "cash_collected", "paid_online", "settled_to_restaurant", "rider_pending", "rider_paid", "refund_pending", "refunded", "failed"],
      default: "pending",
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    restaurantRevenue: { type: Number, default: 0 },
    riderEarning: { type: Number, default: 0 },
    platformEarning: { type: Number, default: 0 },
    cashCollectedAmount: { type: Number, default: 0 },
    financialSettled: { type: Boolean, default: false },
    settledAt: Date,
    refundStatus: { type: String, enum: ["none", "requested", "under_review", "approved", "rejected", "refunded"], default: "none" },
    refundReason: String,
    refundAmount: { type: Number, default: 0 },
    refundRequestedAt: Date,
    refundedAt: Date,
    couponCode: String,
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    otp: String,
    deliveryOtp: String,
    otpVerified: { type: Boolean, default: false },
    emergencyMode: { type: Boolean, default: false },
    freshnessScore: { type: Number, default: 100 },
    estimatedDeliveryTime: Number,
    statusTimeline: [
      {
        status: String,
        label: String,
        at: { type: Date, default: Date.now },
      },
    ],
    assignedAt: Date,
    pickedAt: Date,
    deliveredAt: Date,
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: Date,
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hiddenForCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    hiddenForRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, isArchived: 1, isDeleted: 1, createdAt: -1 });
orderSchema.index({ customer: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ rider: 1, status: 1, updatedAt: -1 });
orderSchema.index({ isDeleted: 1, deletedAt: 1 });

module.exports = mongoose.model("Order", orderSchema);
