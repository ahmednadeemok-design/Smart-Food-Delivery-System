const mongoose = require("mongoose");

const trustScoreSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ["customer", "rider", "restaurant"], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, default: 100, min: 0, max: 100 },
    reason: String,
    change: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrustScore", trustScoreSchema);
