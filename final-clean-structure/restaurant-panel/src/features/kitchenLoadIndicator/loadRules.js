export function getKitchenLoad(activeOrders = 0) {
  if (activeOrders <= 5) return { label: "low", color: "var(--success)", percentage: 30 };
  if (activeOrders <= 12) return { label: "medium", color: "var(--warning)", percentage: 65 };
  return { label: "high", color: "var(--danger)", percentage: 92 };
}
