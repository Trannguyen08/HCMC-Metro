import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/backend-api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  // Axios may pass relative urls like "/auth/login/" or absolute.
  return (
    url.includes("/auth/login/") ||
    url.includes("/auth/login/refresh/") ||
    url.includes("/auth/register/") ||
    url.includes("/auth/google/") ||
    url.includes("/auth/logout/")
  );
}

// ─── Request interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && !isAuthEndpoint(config.url)) {
    // Check localStorage first (regular users)
    let access = localStorage.getItem("metro.access");
    
    // If not found, check sessionStorage (admin users)
    if (!access) {
      access = sessionStorage.getItem("metro.admin.access");
    }

    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

// ─── Response interceptor: try refresh on 401 ─────────────────────────────
let refreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Never attempt refresh for auth endpoints; let the caller handle errors.
    if (error.response?.status === 401 && !original?._retry && !refreshing && !isAuthEndpoint(original?.url)) {
      original._retry = true;
      refreshing = true;
      try {
        // Find whichever refresh token we have
        const refresh = localStorage.getItem("metro.refresh") ?? sessionStorage.getItem("metro.admin.refresh");
        const isAdmin = !!sessionStorage.getItem("metro.admin.refresh");

        if (!refresh) throw new Error("no refresh token");

        const { data } = await axios.post(`${API_BASE}/auth/login/refresh/`, {
          refresh,
        });

        if (isAdmin) {
          sessionStorage.setItem("metro.admin.access", data.access);
        } else {
          localStorage.setItem("metro.access", data.access);
        }

        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Refresh failed — clear tokens
        localStorage.removeItem("metro.access");
        localStorage.removeItem("metro.refresh");
        localStorage.removeItem("metro.user");
        sessionStorage.removeItem("metro.admin.access");
        sessionStorage.removeItem("metro.admin.refresh");

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
