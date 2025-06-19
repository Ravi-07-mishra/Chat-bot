import axios from "axios";

const api = axios.create({
  baseURL: "/api",    // ← works in both dev (Vite proxy) and prod (Vercel rewrite)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// global 401 handler
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
