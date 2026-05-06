import api from "./api.js";

export const getRecommendations = () => api.get("/ai/recommendations");
export const calculateFreshnessScore = (payload) => api.post("/ai/freshness-score", payload);
export const calculateKitchenLoad = (payload) => api.post("/ai/kitchen-load", payload);
export const calculateDeliveryCost = (payload) => api.post("/ai/delivery-cost", payload);
