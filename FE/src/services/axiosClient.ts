import axios from "axios";
import { getToken, removeToken } from "../utils/auth";
import { message } from "antd";

declare const process: {
  env: Record<string, string | undefined>;
};

const resolveBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    if (isLocalHost) {
      return `${window.location.protocol}//${window.location.hostname}:10000`;
    }
  }

  return 'https://myticket-backend.onrender.com';
};

const BASE_URL = resolveBaseUrl();

const axiosClient = axios.create({
  baseURL: BASE_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});

// QUAN TRỌNG: Interceptor này giúp tự động gắn Token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
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
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || "Có lỗi xảy ra";

    if (status === 401) {
      removeToken();
      message.error("Token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại");
      console.error("Token hết hạn hoặc không hợp lệ");
    } else if (status === 403) {
      message.error(errorMessage);
      console.error("Lỗi 403:", errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;