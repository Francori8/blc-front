import axios from "axios";

const TOKEN_KEY = "blc_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sin redirección acá — el guard del layout maneja eso
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);
