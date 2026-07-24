import axios from "axios";
import { getToken, logout } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "حدث خطأ غير متوقع";
    error.arabicMessage = message;

    const isLoginRequest = error.config?.url?.includes("/api/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      logout();
    } else if (error.response?.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail: message }));
    }

    return Promise.reject(error);
  }
);

export default api;
