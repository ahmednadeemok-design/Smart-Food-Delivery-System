export function getFraudRisk({ fakeComplaintCount = 0, totalComplaints = 0 }) {
  const rate = fakeComplaintCount / Math.max(totalComplaints, 1);
  if (rate >= 0.5) return "High";
  if (rate >= 0.25) return "Medium";
  return "Low";
}
