export const mockUsers = [
  { _id: "U-NWL-001", name: "Ahmed", email: "ahmed@example.com", role: "customer", trustScore: 92 },
  { _id: "U-NWL-002", name: "Mahtab", email: "mahtab@example.com", role: "rider", trustScore: 86 },
  { _id: "U-NWL-003", name: "Narowal Restaurant Owner", email: "owner@example.com", role: "restaurant", trustScore: 89 }
];

export const mockRiders = [
  { _id: "R-NWL-001", name: "Ali Rider", isOnline: true, activeOrders: 2, trustScore: 91 },
  { _id: "R-NWL-002", name: "Usman Rider", isOnline: false, activeOrders: 0, trustScore: 76 },
  { _id: "R-NWL-003", name: "Bilal Rider", isOnline: true, activeOrders: 3, trustScore: 68 }
];

export const mockRestaurants = [
  { _id: "RES-NWL-001", name: "Palmer Restaurant", kitchenLoad: "medium", trustScore: 93, accuracyRate: 96 },
  { _id: "RES-NWL-002", name: "Buddy's Narowal", kitchenLoad: "high", trustScore: 90, accuracyRate: 94 },
  { _id: "RES-NWL-003", name: "Virsa Restaurant Narowal", kitchenLoad: "medium", trustScore: 97, accuracyRate: 98 }
];

export const mockComplaints = [
  { _id: "C-NWL-001", type: "late_delivery", customer: "Ahmed", status: "open", aiDecision: "partial_refund", compensation: 100 },
  { _id: "C-NWL-002", type: "missing_item", customer: "Mahtab", status: "reviewing", aiDecision: "manual_review_required", compensation: 0 },
  { _id: "C-NWL-003", type: "bad_quality", customer: "Khurram", status: "open", aiDecision: "manual_review_required", compensation: 0 }
];

export const mockPayments = [
  { _id: "P-NWL-001", amount: 1450, method: "cod", status: "paid" },
  { _id: "P-NWL-002", amount: 2200, method: "card", status: "pending" },
  { _id: "P-NWL-003", amount: 980, method: "wallet", status: "refunded" }
];
