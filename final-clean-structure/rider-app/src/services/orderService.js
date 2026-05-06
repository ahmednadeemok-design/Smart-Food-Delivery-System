import api from "./api.js";
export const getMyOrders = () => api.get("/orders/my");
export const updateOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status });
export const verifyDelivery = (orderId, otp) => api.post(`/orders/${orderId}/verify-delivery`, { otp });
