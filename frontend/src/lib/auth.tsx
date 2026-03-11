"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<Omit<AuthUser, "id">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "metro-hcm.auth.user";

function safeParseUser(value: string | null): AuthUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AuthUser;
    if (!parsed?.id || !parsed?.name || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(safeParseUser(localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login: async ({ identifier, password }) => {
        await new Promise((r) => setTimeout(r, 650));
        if (!identifier.trim()) throw new Error("Vui lòng nhập Email/SĐT.");
        if (password.trim().length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự.");

        setUser({
          id: "u_001",
          name: "Người dùng Metro",
          email: identifier.includes("@") ? identifier : "user@metrohcm.vn",
          phone: identifier.includes("@") ? "0900000000" : identifier
        });
      },
      register: async ({ name, email, phone, password }) => {
        await new Promise((r) => setTimeout(r, 750));
        if (!name.trim()) throw new Error("Vui lòng nhập họ tên.");
        if (!email.includes("@")) throw new Error("Email không hợp lệ.");
        if (phone.replace(/\D/g, "").length < 9) throw new Error("Số điện thoại không hợp lệ.");
        if (password.trim().length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự.");

        setUser({ id: "u_001", name, email, phone });
      },
      logout: () => setUser(null),
      updateProfile: (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev))
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

