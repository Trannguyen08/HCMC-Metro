import { AuthUser } from "../types";

export function getPostAuthRedirect(
  user: Pick<AuthUser, "is_admin"> | null | undefined, 
  pendingBooking?: any
) {
  if (pendingBooking) return "/dat-ve";
  return user?.is_admin ? "/admin" : "/";
}

