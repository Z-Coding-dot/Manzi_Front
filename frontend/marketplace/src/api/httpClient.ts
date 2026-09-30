import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 15000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("manzil_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
