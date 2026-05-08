import api from "./api.js";

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}/restaurant-status`, { status });

export const getRestaurantOrders = () => api.get("/restaurants/my/orders");
