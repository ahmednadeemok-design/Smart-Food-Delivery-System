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
    items: [orderItemSchema],
    deliveryAddress: { type: String, required: true },
    deliveryLocation: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "assigned", "picked", "delivered", "cancelled", "rejected"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cod", "card", "wallet"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    otp: String,
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
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
