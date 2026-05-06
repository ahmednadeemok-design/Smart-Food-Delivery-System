import api from "./api.js";

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}/status`, { status });

// Backend me restaurant-specific orders endpoint abhi nahi hai,
// is liye panel demo/mock + status integration ke liye ready hai.
export const getRestaurantOrders = async () => {
  return { data: { data: [] } };
};
