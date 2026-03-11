"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  email_verified?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: { identifier: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (input: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ email: string; verification_token: string }>;
  verifyEmailOtp: (input: { verification_token: string; otp: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<AuthUser, "id">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const KEYS = {
  user: "metro.user",
  access: "metro.access",
  refresh: "metro.refresh",
} as const;

// ─── Google Identity Services loader ─────────────────────────────────────────

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (document.getElementById("google-gsi")) return resolve();
    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEYS.user);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  function _persistAuth(data: { access: string; refresh: string; user: AuthUser }) {
    localStorage.setItem(KEYS.access, data.access);
    localStorage.setItem(KEYS.refresh, data.refresh);
    localStorage.setItem(KEYS.user, JSON.stringify(data.user));
    setUser(data.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,

      // ── Email / phone login ───────────────────────────────────────────────
      login: async ({ identifier, password }) => {
        try {
          const { data } = await api.post("/auth/login/", { identifier, password });
          _persistAuth(data);
        } catch (err: any) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.errors?.[Object.keys(err.response.data.errors ?? {})[0]]?.[0] ||
            "Đăng nhập thất bại.";
          throw new Error(msg);
        }
      },

      // ── Google OAuth ──────────────────────────────────────────────────────
      loginWithGoogle: async () => {
        // We will remove this function from context and use useGoogleLogin directly in the component
        // Since useGoogleLogin requires being inside the GoogleOAuthProvider context,
        // it's better to call it from within the LoginPage component instead of here.
        throw new Error("Pushed to component layer for GoogleOAuthProvider context");
      },

      // ── Register ──────────────────────────────────────────────────────────
      register: async ({ full_name, email, phone, password }) => {
        try {
          const { data } = await api.post("/auth/register/", {
            full_name,
            email,
            phone,
            password,
          });
          return {
            email: data.email as string,
            verification_token: data.verification_token as string,
          };
        } catch (err: any) {
          const errors = err?.response?.data?.errors;
          const firstKey = errors ? Object.keys(errors)[0] : null;
          const msg =
            (firstKey && errors[firstKey]?.[0]) ||
            err?.response?.data?.detail ||
            "Đăng ký thất bại.";
          throw new Error(msg);
        }
      },

      verifyEmailOtp: async ({ verification_token, otp }) => {
        try {
          const { data } = await api.post("/auth/email/verify-otp/", {
            verification_token,
            otp,
          });
          _persistAuth(data);
        } catch (err: any) {
          const msg =
            err?.response?.data?.detail ||
            "Xác thực email thất bại.";
          throw new Error(msg);
        }
      },

      // ── Logout ────────────────────────────────────────────────────────────
      logout: async () => {
        const refresh = localStorage.getItem(KEYS.refresh);
        try {
          if (refresh) await api.post("/auth/logout/", { refresh });
        } catch {}
        localStorage.removeItem(KEYS.access);
        localStorage.removeItem(KEYS.refresh);
        localStorage.removeItem(KEYS.user);
        setUser(null);
      },

      updateProfile: (patch) =>
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          localStorage.setItem(KEYS.user, JSON.stringify(next));
          return next;
        }),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng trong AuthProvider");
  return ctx;
}
