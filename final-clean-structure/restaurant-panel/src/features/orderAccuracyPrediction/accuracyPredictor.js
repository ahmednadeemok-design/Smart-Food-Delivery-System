export function predictOrderAccuracy({ wrongItemComplaints = 0, totalOrders = 100 }) {
  const complaintRate = wrongItemComplaints / Math.max(totalOrders, 1);
  return Math.max(40, Math.round(100 - complaintRate * 100));
}
