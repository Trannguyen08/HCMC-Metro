import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { authService, getApiErrorMessage } from "@/features/auth/services/auth-service";
import { AuthUser } from "@/features/auth/types";
import { toast } from "@/store/use-toast-store";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  pendingBooking: any | null;
  setUser: (user: AuthUser | null) => void;
  login: (input: { identifier: string; password: string }) => Promise<AuthUser>;
  loginWithGoogle: (payload: { access_token?: string; credential?: string }) => Promise<AuthUser>;
  register: (input: {
    full_name: string;
    email: string;
    phone: string;
    date_of_birth?: string | null;
    password: string;
  }) => Promise<{ email: string; verification_token: string }>;
  verifyEmailOtp: (input: { verification_token: string; otp: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<AuthUser, "id">>) => void;
  setError: (error: string | null) => void;
  setPendingBooking: (booking: any | null) => void;
  setHasHydrated: (value: boolean) => void;
  syncSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,
      pendingBooking: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setError: (error) => {
        set({ error });
        if (error) {
          toast.error(error);
        }
      },

      login: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login(input);
          if (data.user?.is_admin) {
            sessionStorage.setItem("metro.admin.access", data.access);
            sessionStorage.setItem("metro.admin.refresh", data.refresh);
            localStorage.removeItem("metro.access");
            localStorage.removeItem("metro.refresh");
          } else {
            localStorage.setItem("metro.access", data.access);
            localStorage.setItem("metro.refresh", data.refresh);
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          toast.success("Đăng nhập thành công!");
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang nhap that bai.");
          set({ error: msg, isLoading: false });
          toast.error(msg);
          throw new Error(msg);
        }
      },

      loginWithGoogle: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.loginWithGoogle(payload);
          if (data.user?.is_admin) {
            sessionStorage.setItem("metro.admin.access", data.access);
            sessionStorage.setItem("metro.admin.refresh", data.refresh);
            localStorage.removeItem("metro.access");
            localStorage.removeItem("metro.refresh");
          } else {
            localStorage.setItem("metro.access", data.access);
            localStorage.setItem("metro.refresh", data.refresh);
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          toast.success("Đăng nhập Google thành công!");
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang nhap Google that bai.");
          set({ error: msg, isLoading: false });
          toast.error(msg);
          throw new Error(msg);
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register(input);
          set({ isLoading: false });
          toast.success("Đăng ký thành công! Vui lòng xác thực email.");
          return data;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang ky that bai.");
          set({ error: msg, isLoading: false });
          toast.error(msg);
          throw new Error(msg);
        }
      },

      verifyEmailOtp: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.verifyEmailOtp(input);
          if (data.user?.is_admin) {
            sessionStorage.setItem("metro.admin.access", data.access);
            sessionStorage.setItem("metro.admin.refresh", data.refresh);
            localStorage.removeItem("metro.access");
            localStorage.removeItem("metro.refresh");
          } else {
            localStorage.setItem("metro.access", data.access);
            localStorage.setItem("metro.refresh", data.refresh);
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          toast.success("Xác thực email thành công!");
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Xac thuc OTP that bai.");
          set({ error: msg, isLoading: false });
          toast.error(msg);
          throw new Error(msg);
        }
      },

      logout: async () => {
        const refresh =
          sessionStorage.getItem("metro.admin.refresh") ?? localStorage.getItem("metro.refresh");
        try {
          await authService.logout(refresh);
        } catch {}
        localStorage.removeItem("metro.access");
        localStorage.removeItem("metro.refresh");
        localStorage.removeItem("metro.user");
        sessionStorage.removeItem("metro.admin.access");
        sessionStorage.removeItem("metro.admin.refresh");
        set({ user: null, isAuthenticated: false });
        toast.info("Đã đăng xuất.");
      },

      updateProfile: (patch) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...patch } });
        }
      },

      setPendingBooking: (booking) => set({ pendingBooking: booking }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      syncSession: async () => {
        if (typeof window === "undefined") return;

        const adminAccess = sessionStorage.getItem("metro.admin.access");
        const adminRefresh = sessionStorage.getItem("metro.admin.refresh");
        const userAccess = localStorage.getItem("metro.access");
        const userRefresh = localStorage.getItem("metro.refresh");

        const hasAdminSession = !!(adminAccess || adminRefresh);
        const hasUserSession = !!(userAccess || userRefresh);
        const hasAnySession = hasAdminSession || hasUserSession;
        const currentUser = get().user;

        const clearAuthState = () => {
          localStorage.removeItem("metro.access");
          localStorage.removeItem("metro.refresh");
          localStorage.removeItem("metro.user");
          sessionStorage.removeItem("metro.admin.access");
          sessionStorage.removeItem("metro.admin.refresh");
          set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        };

        if (!hasAnySession) {
          if (currentUser || get().isAuthenticated) {
            clearAuthState();
          }
          return;
        }

        if (currentUser?.is_admin && !hasAdminSession) {
          clearAuthState();
          return;
        }

        if (currentUser && !currentUser.is_admin && !hasUserSession) {
          clearAuthState();
          return;
        }

        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, error: null, isLoading: false });
        } catch {
          clearAuthState();
        }
      },
    }),
    {
      name: "metro.user",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
