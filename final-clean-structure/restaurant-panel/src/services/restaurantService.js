import api from "./api.js";

export const createRestaurant = (payload) => api.post("/restaurants", payload);
export const getRestaurants = () => api.get("/restaurants");
export const getMyRestaurants = () => api.get("/restaurants/mine");
export const updateRestaurant = (restaurantId, payload) => api.put(`/restaurants/${restaurantId}`, payload);
export const addFoodItem = (restaurantId, payload) => api.post(`/restaurants/${restaurantId}/items`, payload);
export const getFoodItems = (restaurantId) => api.get(`/restaurants/${restaurantId}/items`);
export const updateFoodItem = (restaurantId, itemId, payload) => api.put(`/restaurants/${restaurantId}/items/${itemId}`, payload);
export const deleteFoodItem = (restaurantId, itemId) => api.delete(`/restaurants/${restaurantId}/items/${itemId}`);
