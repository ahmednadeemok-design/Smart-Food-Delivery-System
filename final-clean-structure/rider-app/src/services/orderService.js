import api from "./api.js";
export const getMyOrders = () => api.get("/orders/my");
export const getAvailableOrders = () => api.get("/riders/available-orders");
export const acceptOrder = (orderId) => api.post(`/riders/orders/${orderId}/accept`);
export const rejectOrder = (orderId) => api.post(`/riders/orders/${orderId}/reject`);
export const markPicked = (orderId) => api.patch(`/riders/orders/${orderId}/picked`);
export const updateOrderStatus = (orderId, status) => api.patch(`/riders/orders/${orderId}/status`, { status });
export const verifyDelivery = (orderId, otp) => api.post(`/riders/orders/${orderId}/verify-otp`, { otp });
