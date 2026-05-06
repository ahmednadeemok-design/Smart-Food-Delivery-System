exports.calculateKitchenLoad = (activeOrders = 0) => {
  if (activeOrders <= 5) return "low";
  if (activeOrders <= 12) return "medium";
  return "high";
};
