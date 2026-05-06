export const mockUsers = [
  { _id: "U-001", name: "Ahmed", email: "ahmed@example.com", role: "customer", trustScore: 92 },
  { _id: "U-002", name: "Mahtab", email: "mahtab@example.com", role: "rider", trustScore: 86 },
  { _id: "U-003", name: "Restaurant Owner", email: "owner@example.com", role: "restaurant", trustScore: 89 }
];

export const mockRiders = [
  { _id: "R-001", name: "Ali Rider", isOnline: true, activeOrders: 2, trustScore: 91 },
  { _id: "R-002", name: "Usman Rider", isOnline: false, activeOrders: 0, trustScore: 76 },
  { _id: "R-003", name: "Bilal Rider", isOnline: true, activeOrders: 3, trustScore: 68 }
];

export const mockRestaurants = [
  { _id: "RES-001", name: "Biryani House", kitchenLoad: "medium", trustScore: 89, accuracyRate: 94 },
  { _id: "RES-002", name: "Pizza Corner", kitchenLoad: "high", trustScore: 78, accuracyRate: 83 },
  { _id: "RES-003", name: "Fresh Cafe", kitchenLoad: "low", trustScore: 95, accuracyRate: 97 }
];

export const mockComplaints = [
  { _id: "C-001", type: "late_delivery", customer: "Ahmed", status: "open", aiDecision: "partial_refund", compensation: 100 },
  { _id: "C-002", type: "missing_item", customer: "Mahtab", status: "reviewing", aiDecision: "manual_review_required", compensation: 0 },
  { _id: "C-003", type: "bad_quality", customer: "Khurram", status: "open", aiDecision: "manual_review_required", compensation: 0 }
];

export const mockPayments = [
  { _id: "P-001", amount: 1450, method: "cod", status: "paid" },
  { _id: "P-002", amount: 2200, method: "card", status: "pending" },
  { _id: "P-003", amount: 980, method: "wallet", status: "refunded" }
];
