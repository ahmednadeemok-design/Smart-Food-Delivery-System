import api from "./api.js";

export const getRestaurants = () => api.get("/restaurants");
