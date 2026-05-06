import api from "./api.js";

export const getRecommendations = () => api.get("/ai/recommendations");
export const calculateFreshnessScore = (payload) => api.post("/ai/freshness-score", payload);
export const calculateKitchenLoad = (payload) => api.post("/ai/kitchen-load", payload);
export const calculateDeliveryCost = (payload) => api.post("/ai/delivery-cost", payload);
export const predictDeliveryTime = (payload) => api.post("/ai/delivery-time", payload);
export const predictOrderAccuracy = (payload) => api.post("/ai/order-accuracy", payload);
export const detectComplaintIntent = (payload) => api.post("/ai/complaint-intent", payload);
export const getRefundDecision = (payload) => api.post("/ai/refund-decision", payload);
export const filterFoodByGoal = (payload) => api.post("/ai/goal-filter", payload);
