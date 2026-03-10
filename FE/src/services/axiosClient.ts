import axios from "axios";
import { removeToken } from "../utils/auth";

// Loại bỏ globalThis để Webpack (trên Vercel) nhận diện được biến môi trường.
// Nếu trên Vercel bị thiếu biến, nó sẽ tự động lấy link Render thay vì localhost.
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://myticket-backend.onrender.com";

// Lưu ý: Nếu đồ án của bạn dùng VITE thay vì Create React App, hãy XÓA dòng trên và dùng dòng dưới này:
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://myticket-backend.onrender.com";

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