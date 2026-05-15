const mongoose = require("mongoose");

const codCollectionSchema = new mongoose.Schema(
  {
    referenceKey: { type: String, required: true, unique: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "collected", "reconciled", "disputed"], default: "collected", index: true },
    collectedAt: Date,
    reconciledAt: Date,
    note: String,
  },
  { timestamps: true }
);

codCollectionSchema.index({ rider: 1, status: 1, createdAt: -1 });
codCollectionSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("CODCollection", codCollectionSchema);
