import api from "./api.js";

export const getRiders = () => api.get("/riders");
