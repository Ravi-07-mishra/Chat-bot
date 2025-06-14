// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // now uses Vite env variable
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach latest token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Handle 401 errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Optional: logout user or redirect to login
      localStorage.removeItem("bot_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
