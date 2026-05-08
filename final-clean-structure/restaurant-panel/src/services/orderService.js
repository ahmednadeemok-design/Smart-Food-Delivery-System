import api from "./api.js";

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/restaurants/my/orders/${orderId}/status`, { status });

export const getRestaurantOrders = () => api.get("/restaurants/my/orders");
