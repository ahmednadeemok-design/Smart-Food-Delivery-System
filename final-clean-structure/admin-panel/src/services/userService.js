import api from "./api.js";

export const getUsers = () => api.get("/users");
