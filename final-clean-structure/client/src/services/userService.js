import api from "./api.js";

export const updateProfile = (payload) => api.put("/users/profile", payload);
export const addSavedAddress = (payload) => api.post("/users/addresses", payload);
export const deleteSavedAddress = (addressId) => api.delete(`/users/addresses/${addressId}`);
