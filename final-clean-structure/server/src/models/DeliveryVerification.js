const mongoose = require("mongoose");

const deliveryVerificationSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    otp: String,
    qrCode: String,
    verifiedByCustomer: { type: Boolean, default: false },
    verifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryVerification", deliveryVerificationSchema);
