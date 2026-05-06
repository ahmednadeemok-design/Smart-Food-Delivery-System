import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("restaurant_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || "Something went wrong";
    const normalizedError = new Error(message);
    normalizedError.status = status;

    if (status === 401) {
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
