import api from "./api.js";

export const registerUser = (payload) => api.post("/auth/register", payload);
export const loginUser = (payload) => api.post("/auth/login", payload);
export const getProfile = () => api.get("/auth/me");
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);
