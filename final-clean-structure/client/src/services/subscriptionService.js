import api from "./api.js";

export const createSubscription = (payload) => api.post("/subscriptions", payload);
export const getMySubscription = () => api.get("/subscriptions/my");
