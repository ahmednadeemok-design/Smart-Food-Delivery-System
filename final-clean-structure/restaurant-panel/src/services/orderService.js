import api from "./api.js";

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}/status`, { status });

export const getRestaurantOrders = () => api.get("/orders/my");
