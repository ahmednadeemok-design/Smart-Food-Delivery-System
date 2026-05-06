import api from "./api.js";

export const calculateKitchenLoad = (payload) => api.post("/ai/kitchen-load", payload);
