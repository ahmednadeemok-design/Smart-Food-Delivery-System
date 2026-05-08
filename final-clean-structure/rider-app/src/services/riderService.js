import api from "./api.js";
export const getMyRiderProfile = () => api.get("/riders/me");
export const createRiderProfile = (payload) => api.post("/riders/profile", payload);
export const updateRiderAvailability = (isOnline, currentLocation) => api.patch("/riders/availability", { isOnline, currentLocation });
export const updateRiderLocation = (currentLocation, isOnline = true) => api.patch("/riders/location", { currentLocation, isOnline });
