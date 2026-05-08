const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["order", "approval", "support", "payment", "system"],
      default: "system",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    readAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
