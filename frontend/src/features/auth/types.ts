export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  email_verified?: boolean;
  is_admin?: boolean;
};

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface RegisterResponse {
  email: string;
  verification_token: string;
}
