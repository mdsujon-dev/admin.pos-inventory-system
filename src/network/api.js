import axios from "axios";
export const url = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: url,
  headers: {
    accept: "application/json",
  },
});

// Request interceptor to update the token before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
export default api;
