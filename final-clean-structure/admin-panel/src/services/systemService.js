import api from "./api.js";

export const getSystemHealth = () => api.get("/system/health");
