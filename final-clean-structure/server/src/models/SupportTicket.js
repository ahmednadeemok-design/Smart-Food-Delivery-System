const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: ["order_issue", "menu_issue", "payout_issue", "technical_issue", "account_issue"],
      default: "technical_issue",
    },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    adminNote: String,
    ownerNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
