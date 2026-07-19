import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "حدث خطأ غير متوقع";
    error.arabicMessage = message;
    return Promise.reject(error);
  }
);

export default api;
