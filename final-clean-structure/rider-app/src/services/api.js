import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rider_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || (status ? `Request failed with status ${status}` : "Server is not reachable. Please make sure backend is running.");
    const normalizedError = new Error(message);
    normalizedError.status = status;

    if (status === 401) {
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
