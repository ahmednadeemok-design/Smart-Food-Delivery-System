import api from "./api.js";

export const getPayments = () => api.get("/payments");
