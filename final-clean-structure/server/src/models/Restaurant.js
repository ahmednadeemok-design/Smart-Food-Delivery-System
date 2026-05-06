const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    phone: String,
    address: String,
    location: { lat: Number, lng: Number },
    image: String,
    cuisineTypes: [String],
    isOpen: { type: Boolean, default: true },
    kitchenLoad: { type: String, enum: ["low", "medium", "high"], default: "low" },
    averagePreparationTime: { type: Number, default: 20 },
    accuracyRate: { type: Number, default: 100 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
