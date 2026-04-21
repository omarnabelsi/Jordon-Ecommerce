import axios from "axios";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isProduction = process.env.NODE_ENV === "production";
const apiBaseUrl = configuredApiUrl || (!isProduction ? "http://localhost:8000/api" : undefined);

if (!configuredApiUrl && isProduction) {
  console.error(
    "Missing NEXT_PUBLIC_API_URL in production. Set it in Netlify site environment variables."
  );
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (!apiBaseUrl && isProduction) {
    return Promise.reject(
      new Error(
        "Missing NEXT_PUBLIC_API_URL in production. Configure it in Netlify to your deployed backend URL ending with /api."
      )
    );
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const requestUrl: string = originalRequest?.url || "";
    const isAuthEndpoint = requestUrl.includes("/auth/");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh/");
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
