// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // e.g. https://my-api.onrender.com/api/v1
  withCredentials: true,                  // send cookies on every request
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor for 401 from protected endpoints (if ever needed)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    // only redirect on 401 if user was already authenticated (cookie present)
    if (status === 401 && document.cookie.includes("auth_token")) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
