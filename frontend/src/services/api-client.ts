import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/backend-api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Helper to determine if an endpoint is related to Auth
function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return (
    url.includes("/auth/login/") ||
    url.includes("/auth/login/refresh/") ||
    url.includes("/auth/register/") ||
    url.includes("/auth/google/") ||
    url.includes("/auth/logout/")
  );
}

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && !isAuthEndpoint(config.url)) {
    const access = localStorage.getItem("metro.access");
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

// Response Interceptor: Token Refresh Logic
let refreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !refreshing &&
      !isAuthEndpoint(original?.url)
    ) {
      original._retry = true;
      refreshing = true;
      try {
        const refresh = localStorage.getItem("metro.refresh");
        if (!refresh) throw new Error("no refresh token");
        
        const { data } = await axios.post(`${API_BASE}/auth/login/refresh/`, {
          refresh,
        });
        
        localStorage.setItem("metro.access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Clear tokens on refresh failure
        localStorage.removeItem("metro.access");
        localStorage.removeItem("metro.refresh");
        localStorage.removeItem("metro.user");
        
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
