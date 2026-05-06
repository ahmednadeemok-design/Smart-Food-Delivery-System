import api from "./api.js";

export const getRestaurants = () => api.get("/restaurants");
export const getRestaurantById = (id) => api.get(`/restaurants/${id}`);
export const getRestaurantItems = (id) => api.get(`/restaurants/${id}/items`);
export const createRestaurant = (payload) => api.post("/restaurants", payload);
export const addFoodItem = (restaurantId, payload) => api.post(`/restaurants/${restaurantId}/items`, payload);
