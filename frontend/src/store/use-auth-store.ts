import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser } from "@/features/auth/types";
import { authService, getApiErrorMessage } from "@/features/auth/services/auth-service";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;

  // Actions
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
  pendingBooking: any | null;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setError: (error) => set({ error }),

      login: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login(input);
          if (data.user?.is_admin) {
            sessionStorage.setItem("metro.admin.access", data.access);
            sessionStorage.setItem("metro.admin.refresh", data.refresh);
            // Never persist admin tokens to localStorage
            localStorage.removeItem("metro.access");
            localStorage.removeItem("metro.refresh");
          } else {
            localStorage.setItem("metro.access", data.access);
            localStorage.setItem("metro.refresh", data.refresh);
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang nhap that bai.");
          set({ error: msg, isLoading: false });
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
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang nhap Google that bai.");
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register(input);
          set({ isLoading: false });
          return data;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Dang ky that bai.");
          set({ error: msg, isLoading: false });
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
          return data.user;
        } catch (err) {
          const msg = getApiErrorMessage(err, "Xac thuc OTP that bai.");
          set({ error: msg, isLoading: false });
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
        sessionStorage.removeItem("metro.admin.access");
        sessionStorage.removeItem("metro.admin.refresh");
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (patch) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...patch } });
        }
      },

      setPendingBooking: (booking) => set({ pendingBooking: booking }),
      pendingBooking: null,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),

    {
      name: "metro.user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Never persist admin user in localStorage
        if (state.user?.is_admin) return { user: null, isAuthenticated: false };
        return { user: state.user, isAuthenticated: state.isAuthenticated };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
