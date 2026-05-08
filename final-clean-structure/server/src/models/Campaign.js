const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["restaurant", "items"], default: "restaurant" },
    itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" }],
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
