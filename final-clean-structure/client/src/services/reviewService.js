import api from "./api.js";

export const createReview = (payload) => api.post("/reviews", payload);
