// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept:       "application/json",
  },
});

// Always attach latest token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bot_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
