// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bot_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const hadAuthHeader = Boolean(err.config.headers?.Authorization);

    if (status === 401 && hadAuthHeader) {
      // only redirect if this was a “real” logged‑in request
      localStorage.removeItem("bot_token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;
