import api from "./api.js";

export const createComplaint = (payload) => api.post("/complaints", payload);
