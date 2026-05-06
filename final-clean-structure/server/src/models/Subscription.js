const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["monthly", "quarterly", "yearly"], default: "monthly" },
    price: { type: Number, required: true },
    benefits: [String],
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    expiryDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
