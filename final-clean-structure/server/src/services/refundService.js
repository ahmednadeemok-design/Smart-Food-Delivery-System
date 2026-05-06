exports.calculateRefund = ({ orderTotal = 0, decision }) => {
  if (decision === "full_refund") return orderTotal;
  if (decision === "partial_refund") return Math.round(orderTotal * 0.25);
  return 0;
};
