const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    vehicleType: { type: String, enum: ["bike", "car", "cycle"], default: "bike" },
    cnic: { type: String, trim: true },
    bikeNumber: { type: String, trim: true },
    profileImage: String,
    phoneVerified: { type: Boolean, default: false },
    currentLocation: { lat: Number, lng: Number },
    isOnline: { type: Boolean, default: false },
    availabilityStatus: { type: String, enum: ["pending_approval", "approved_offline", "online", "busy", "suspended"], default: "pending_approval" },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    activeOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    earnings: { type: Number, default: 0 },
    dailyEarnings: { type: Number, default: 0 },
    weeklyEarnings: { type: Number, default: 0 },
    maxBatchOrders: { type: Number, default: 3 },
    workloadScore: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    completedDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", riderSchema);
