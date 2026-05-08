import api from "./api.js";
export const registerRider = (payload) => api.post("/auth/register", { ...payload, role: "rider" });
export const loginRider = (payload) => api.post("/auth/login", payload);
export const getProfile = () => api.get("/auth/me");
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);
