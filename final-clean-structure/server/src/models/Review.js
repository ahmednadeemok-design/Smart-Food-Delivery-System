const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    foodItem: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
