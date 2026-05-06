const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    vehicleType: { type: String, enum: ["bike", "car", "cycle"], default: "bike" },
    currentLocation: { lat: Number, lng: Number },
    isOnline: { type: Boolean, default: false },
    activeOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    maxBatchOrders: { type: Number, default: 3 },
    workloadScore: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    completedDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", riderSchema);
