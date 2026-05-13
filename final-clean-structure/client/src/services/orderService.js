import api from "./api.js";

export const createOrder = (payload) => api.post("/orders", payload);
export const getMyOrders = (params = {}) => api.get("/orders/my", { params });
export const verifyDelivery = (orderId, otp) => api.post(`/orders/${orderId}/verify-delivery`, { otp });
export const cancelOrder = (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason });
export const hideMyOrder = (orderId) => api.patch(`/orders/${orderId}/hide`);
export const requestRefund = (orderId, payload) => api.post(`/payments/orders/${orderId}/refund-request`, payload);
