const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    phone: String,
    address: String,
    localArea: String,
    location: { lat: Number, lng: Number },
    image: String,
    logo: String,
    banner: String,
    cuisineTypes: [String],
    businessHours: {
      opensAt: { type: String, default: "11:00" },
      closesAt: { type: String, default: "23:30" },
    },
    isFeatured: { type: Boolean, default: false },
    offerText: String,
    deliveryFeeBase: { type: Number, default: 90 },
    isOpen: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    qualityFlag: { type: Boolean, default: false },
    qualityFlagReason: String,
    kitchenLoad: { type: String, enum: ["low", "medium", "high"], default: "low" },
    averagePreparationTime: { type: Number, default: 20 },
    accuracyRate: { type: Number, default: 100 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
