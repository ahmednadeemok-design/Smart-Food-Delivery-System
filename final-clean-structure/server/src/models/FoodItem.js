const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
    category: String,
    calories: { type: Number, default: 0 },
    tags: [String],
    preparationTime: { type: Number, default: 15 },
    addOns: [{ name: String, price: { type: Number, default: 0 } }],
    options: [{ name: String, values: [String], required: { type: Boolean, default: false } }],
    isFeatured: { type: Boolean, default: false },
    soldCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    tasteScore: { type: Number, default: 100 },
    complaintCount: { type: Number, default: 0 },
    isOutOfStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
