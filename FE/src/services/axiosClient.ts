import axios from "axios";
import { getToken, removeToken } from "../utils/auth";
import { message } from "antd";

declare const process: {
  env: Record<string, string | undefined>;
};

// Loại bỏ globalThis để Webpack (trên Vercel) nhận diện được biến môi trường.
// Có sẵn fallback dự phòng link Render để đảm bảo 100% không bị sập kết nối.
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://myticket-backend.onrender.com";

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