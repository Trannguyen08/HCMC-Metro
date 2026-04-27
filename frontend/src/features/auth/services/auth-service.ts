import api from "@/lib/api";
import axios from "axios";
import { AuthUser, LoginResponse, RegisterResponse } from "../types";

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;

    const errors = error.response?.data?.errors;
    if (errors && typeof errors === "object") {
      const firstField = Object.keys(errors)[0];
      const firstError = firstField ? errors[firstField]?.[0] : null;
      if (typeof firstError === "string" && firstError.trim()) return firstError;
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};

export const authService = {
  login: async (input: { identifier: string; password: string }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login/", input);
    return data;
  },

  loginWithGoogle: async (payload: {
    access_token?: string;
    credential?: string;
  }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/google/", payload);
    return data;
  },

  register: async (input: {
    full_name: string;
    email: string;
    phone: string;
    date_of_birth?: string | null;
    password: string;
  }): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>("/auth/register/", input);
    return data;
  },

  verifyEmailOtp: async (input: {
    verification_token: string;
    otp: string;
  }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/email/verify-otp/", input);
    return data;
  },

  logout: async (refresh: string | null): Promise<void> => {
    if (refresh) {
      await api.post("/auth/logout/", { refresh });
    }
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await api.get<AuthUser>("/auth/me/");
    return data;
  },
};
