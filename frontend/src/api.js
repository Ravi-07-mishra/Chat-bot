import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://your-backend.onrender.com/api/v1
  withCredentials: true,                 // send cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Optional: only redirect on 401 if cookie is present
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      document.cookie.includes("auth_token")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
