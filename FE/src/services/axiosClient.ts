import axios from "axios";
import { removeToken } from "../utils/auth";

const BASE_URL =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env?.REACT_APP_API_BASE_URL || "http://localhost:3000";

const axiosClient = axios.create({
  baseURL: BASE_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ QUAN TRỌNG: Interceptor này giúp tự động gắn Token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      removeToken();
      console.error("Token hết hạn hoặc không hợp lệ");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;