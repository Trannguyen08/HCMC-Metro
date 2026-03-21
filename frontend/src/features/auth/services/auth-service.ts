import api from "@/services/api-client";
import { AuthUser, LoginResponse, RegisterResponse } from "../types";

export const authService = {
  login: async (input: { identifier: string; password: string }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login/", input);
    return data;
  },

  loginWithGoogle: async (access_token: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/google/", { access_token });
    return data;
  },

  register: async (input: {
    full_name: string;
    email: string;
    phone: string;
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
