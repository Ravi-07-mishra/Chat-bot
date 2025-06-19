import axios from "axios";

const api = axios.create({
  baseURL: "/api",    // ← must be exactly "/api" so proxy + rewrite both work
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
    if (err.response?.status === 401) {
      localStorage.removeItem("bot_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
