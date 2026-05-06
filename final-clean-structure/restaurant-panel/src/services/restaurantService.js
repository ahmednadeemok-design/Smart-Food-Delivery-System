import api from "./api.js";

export const createRestaurant = (payload) => api.post("/restaurants", payload);
export const getRestaurants = () => api.get("/restaurants");
export const addFoodItem = (restaurantId, payload) => api.post(`/restaurants/${restaurantId}/items`, payload);
export const getFoodItems = (restaurantId) => api.get(`/restaurants/${restaurantId}/items`);
