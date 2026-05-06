export const mockOrders = [
  { _id: "ORD-2001", customer: "Ahmed", items: "Biryani x2, Raita x1", amount: 1450, status: "pending", priority: "Emergency", prepTime: 14 },
  { _id: "ORD-2002", customer: "Mahtab", items: "Pizza Large x1", amount: 2200, status: "preparing", priority: "Normal", prepTime: 22 },
  { _id: "ORD-2003", customer: "Khurram", items: "Zinger x2", amount: 980, status: "ready", priority: "Normal", prepTime: 18 }
];

export const mockQualityAudits = [
  { dish: "Chicken Biryani", tasteScore: 91, complaints: 2, sentiment: "positive" },
  { dish: "Zinger Burger", tasteScore: 72, complaints: 8, sentiment: "neutral" },
  { dish: "Loaded Fries", tasteScore: 58, complaints: 13, sentiment: "negative" }
];
