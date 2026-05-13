import api from "./api.js";

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/restaurants/my/orders/${orderId}/status`, { status });

export const getRestaurantOrders = (params = {}) => api.get("/restaurants/my/orders", { params });
export const hideRestaurantOrder = (orderId) => api.patch(`/restaurants/my/orders/${orderId}/hide`);
