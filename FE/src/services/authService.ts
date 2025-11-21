import axiosClient from "./axiosClient";

const API_URL = "http://localhost:3000/api/user";

export const loginAPI = (data) => axiosClient.post("/api/user/login", data);
export const registerAPI = (data) => axiosClient.post("/api/user", data);
