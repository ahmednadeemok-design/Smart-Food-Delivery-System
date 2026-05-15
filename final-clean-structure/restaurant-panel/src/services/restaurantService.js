import api from "./api.js";

export const createRestaurant = (payload) => api.post("/restaurants", payload);
export const getRestaurants = () => api.get("/restaurants");
export const getMyRestaurants = () => api.get("/restaurants/my");
export const getRestaurantDashboard = () => api.get("/restaurants/my/dashboard");
export const getRestaurantReports = () => api.get("/restaurants/my/reports");
export const getRestaurantFinance = () => api.get("/restaurants/my/finance");
export const createRestaurantPayoutRequest = (payload) => api.post("/restaurants/my/payout-requests", payload);
export const updateMyRestaurant = (payload) => api.patch("/restaurants/my", payload);
export const updateRestaurantOpenStatus = (isOpen) => api.patch("/restaurants/my/open-status", { isOpen });
export const updateBusinessHours = (payload) => api.patch("/restaurants/my/business-hours", payload);
export const updateRestaurant = (restaurantId, payload) => api.put(`/restaurants/${restaurantId}`, payload);
export const addFoodItem = (restaurantId, payload) => api.post(`/restaurants/${restaurantId}/items`, payload);
export const addMyFoodItem = (payload) => api.post("/restaurants/my/menu", payload);
export const getFoodItems = (restaurantId) => api.get(`/restaurants/${restaurantId}/items`);
export const getPublicMenu = (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`);
export const updateFoodItem = (restaurantId, itemId, payload) => api.put(`/restaurants/${restaurantId}/items/${itemId}`, payload);
export const updateMyFoodItem = (itemId, payload) => api.patch(`/restaurants/my/menu/${itemId}`, payload);
export const updateMyFoodItemAvailability = (itemId, payload) => api.patch(`/restaurants/my/menu/${itemId}/availability`, payload);
export const deleteFoodItem = (restaurantId, itemId) => api.delete(`/restaurants/${restaurantId}/items/${itemId}`);
export const deleteMyFoodItem = (itemId) => api.delete(`/restaurants/my/menu/${itemId}`);

export const getCampaigns = () => api.get("/restaurants/my/campaigns");
export const createCampaign = (payload) => api.post("/restaurants/my/campaigns", payload);
export const updateCampaign = (campaignId, payload) => api.patch(`/restaurants/my/campaigns/${campaignId}`, payload);
export const deleteCampaign = (campaignId) => api.delete(`/restaurants/my/campaigns/${campaignId}`);

export const getSupportTickets = () => api.get("/restaurants/my/support-tickets");
export const createSupportTicket = (payload) => api.post("/restaurants/my/support-tickets", payload);
export const updateSupportTicket = (ticketId, payload) => api.patch(`/restaurants/my/support-tickets/${ticketId}`, payload);
export const updateRestaurantAccount = (payload) => api.put("/users/profile", payload);
