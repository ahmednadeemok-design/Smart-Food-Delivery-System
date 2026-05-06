import api from "./api.js";

export const getAdminUsers = () => api.get("/admin/users");
export const updateAdminUser = (id, payload) => api.patch(`/admin/users/${id}`, payload);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const getAdminRestaurants = () => api.get("/admin/restaurants");
export const updateAdminRestaurant = (id, payload) => api.patch(`/admin/restaurants/${id}`, payload);
export const deleteAdminRestaurant = (id) => api.delete(`/admin/restaurants/${id}`);
export const getAdminRestaurantMenu = (id) => api.get(`/admin/restaurants/${id}/menu`);

export const getAdminRiders = () => api.get("/admin/riders");
export const updateAdminRider = (id, payload) => api.patch(`/admin/riders/${id}`, payload);

export const getAdminOrders = (status = "") => api.get(`/admin/orders${status ? `?status=${status}` : ""}`);
export const updateAdminOrder = (id, payload) => api.patch(`/admin/orders/${id}`, payload);

export const getAdminComplaints = () => api.get("/admin/complaints");
export const updateAdminComplaint = (id, payload) => api.patch(`/admin/complaints/${id}`, payload);

export const getAdminPayments = () => api.get("/admin/payments");
export const refundAdminPayment = (id, payload) => api.patch(`/admin/payments/${id}/refund`, payload);

export const adjustTrustScore = (payload) => api.post("/admin/trust-scores", payload);
export const getTrustHistory = () => api.get("/admin/trust-scores");
export const getAuditLogs = () => api.get("/admin/audit-logs");
