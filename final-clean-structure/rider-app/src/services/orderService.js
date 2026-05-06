import api from "./api.js";
export const getMyOrders = () => api.get("/orders/my");
export const getAvailableOrders = () => api.get("/orders/available");
export const acceptOrder = (orderId) => api.post(`/orders/${orderId}/accept`);
export const updateOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status });
export const verifyDelivery = (orderId, otp) => api.post(`/orders/${orderId}/verify-delivery`, { otp });
