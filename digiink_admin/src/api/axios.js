import axios from "axios";

const api = axios.create({
  baseURL: "/api/superadmin",
});

// Har request mein token auto attach
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sa_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 aaye to logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("sa_token");
      localStorage.removeItem("sa_admin");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;