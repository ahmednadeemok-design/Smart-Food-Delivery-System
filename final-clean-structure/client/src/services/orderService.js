import api from "./api.js";

export const createOrder = (payload) => api.post("/orders", payload);
export const getMyOrders = () => api.get("/orders/my");
export const verifyDelivery = (orderId, otp) => api.post(`/orders/${orderId}/verify-delivery`, { otp });
export const cancelOrder = (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason });
