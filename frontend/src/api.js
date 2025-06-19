// src/api.js
import axios from "axios";

// detect dev vs prod
const isDev = import.meta.env.DEV;

// in dev: point at your Render (or localhost) URL;
// in prod: use relative /api so Vercel will proxy to Render
const baseURL = isDev
  ? import.meta.env.VITE_API_URL   // e.g. https://chat‑bot-0je8.onrender.com/api/v1
  : "/api";

const api = axios.create({
  baseURL,
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
      localStorage.removeItem("bot_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
