import api from "./api.js";
export const createRiderProfile = (payload) => api.post("/riders/profile", payload);
export const updateRiderLocation = (currentLocation) => api.patch("/riders/location", { currentLocation });
