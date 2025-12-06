import axiosClient from "./axiosClient";

const USER_API_ROUTE = "/api/user";

// Gán kiểu dữ liệu cho 'data'
export const loginAPI = (data: any) => axiosClient.post(`${USER_API_ROUTE}/login`, data);
export const registerAPI = (data: any) => axiosClient.post(USER_API_ROUTE, data);