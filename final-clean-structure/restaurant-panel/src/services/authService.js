import api from "./api.js";

export const registerRestaurantUser = (payload) =>
  api.post("/auth/register", { ...payload, role: "restaurant" });

export const loginRestaurantUser = (payload) => api.post("/auth/login", payload);
export const getProfile = () => api.get("/auth/me");
