import api from "./api.js";

export const getAdminUsers = () => api.get("/admin/users");
export const updateAdminUser = (id, payload) => api.patch(`/admin/users/${id}`, payload);
export const issuePasswordReset = (id, payload = {}) => api.post(`/admin/users/${id}/password-reset`, payload);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const getAdminRestaurants = () => api.get("/admin/restaurants");
export const getAdminRestaurant = (id) => api.get(`/admin/restaurants/${id}`);
export const updateAdminRestaurant = (id, payload) => api.patch(`/admin/restaurants/${id}`, payload);
export const approveAdminRestaurant = (id, payload = {}) => api.patch(`/admin/restaurants/${id}/approve`, payload);
export const rejectAdminRestaurant = (id, payload = {}) => api.patch(`/admin/restaurants/${id}/reject`, payload);
export const suspendAdminRestaurant = (id, payload = {}) => api.patch(`/admin/restaurants/${id}/suspend`, payload);
export const reactivateAdminRestaurant = (id, payload = {}) => api.patch(`/admin/restaurants/${id}/reactivate`, payload);
export const resetRestaurantOwnerPassword = (id, payload = {}) => api.patch(`/admin/restaurants/${id}/reset-owner-password`, payload);
export const deleteAdminRestaurant = (id) => api.delete(`/admin/restaurants/${id}`);
export const getAdminRestaurantMenu = (id) => api.get(`/admin/restaurants/${id}/menu`);
export const getRestaurantSupportTickets = () => api.get("/admin/restaurant-support-tickets");
export const updateRestaurantSupportTicket = (id, payload) => api.patch(`/admin/restaurant-support-tickets/${id}`, payload);

export const getAdminRiders = () => api.get("/admin/riders");
export const updateAdminRider = (id, payload) => api.patch(`/admin/riders/${id}`, payload);

export const getAdminOrders = (params = {}) => api.get("/admin/orders", { params });
export const updateAdminOrder = (id, payload) => api.patch(`/admin/orders/${id}`, payload);
export const trashAdminOrder = (id, payload = {}) => api.patch(`/admin/orders/${id}/trash`, payload);
export const restoreAdminOrder = (id, payload = {}) => api.patch(`/admin/orders/${id}/restore`, payload);
export const permanentlyDeleteAdminOrder = (id, payload = {}) => api.delete(`/admin/orders/${id}/permanent`, { data: payload });

export const getAdminComplaints = () => api.get("/admin/complaints");
export const updateAdminComplaint = (id, payload) => api.patch(`/admin/complaints/${id}`, payload);

export const getAdminPayments = () => api.get("/admin/payments");
export const refundAdminPayment = (id, payload) => api.patch(`/admin/payments/${id}/refund`, payload);
export const getFinanceSummary = () => api.get("/admin/finance/summary");

export const adjustTrustScore = (payload) => api.post("/admin/trust-scores", payload);
export const getTrustHistory = () => api.get("/admin/trust-scores");
export const getAuditLogs = () => api.get("/admin/audit-logs");
