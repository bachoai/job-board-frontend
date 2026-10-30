import axios from "axios";

// Keep legacy VITE_API_URL working when this frontend is merged with part A.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api"
).replace(/\/$/, "");
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: "application/json" },
  validateStatus: () => true,
});
