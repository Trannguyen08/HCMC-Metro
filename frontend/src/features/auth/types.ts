export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string | null;
  avatar_url?: string;
  email_verified?: boolean;
  is_admin?: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
    discount_rate: string;
  };
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
