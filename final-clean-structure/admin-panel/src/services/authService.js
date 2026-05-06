import api from "./api.js";

export const registerAdmin = (payload) =>
  api.post("/auth/register", { ...payload, role: "admin" });

export const loginAdmin = (payload) => api.post("/auth/login", payload);
export const getProfile = () => api.get("/auth/me");
