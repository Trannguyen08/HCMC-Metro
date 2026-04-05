import { AuthUser } from "../types";

export function getPostAuthRedirect(user: Pick<AuthUser, "is_admin"> | null | undefined) {
  return user?.is_admin ? "/admin" : "/";
}
