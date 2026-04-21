# Auth Domain Reference

Read this file for login, register, Google login, JWT handling, and auth-related client state.

## Scope

- Email or phone login
- Registration plus OTP verification
- Google login
- JWT persistence and logout
- Admin/user permission checks

## Frontend ownership

- Active auth service: `frontend/src/features/auth/services/auth-service.ts`
- Active auth hook: `frontend/src/features/auth/hooks/use-auth.ts`
- Active auth state: `frontend/src/store/use-auth-store.ts`
- API client used by feature services: `frontend/src/services/api-client.ts`
- Older parallel auth layer still present:
  - `frontend/src/lib/api.ts`
  - `frontend/src/lib/auth.tsx`
- Auth route pages:
  - `frontend/src/app/(routes)/(auth)/login/page.tsx`
  - `frontend/src/app/(routes)/(auth)/register/page.tsx`
  - `frontend/src/app/(routes)/(auth)/verify-email/page.tsx`

## Backend ownership

- URLs: `backend/apps/users/urls.py`
- Auth views: `backend/apps/users/views/auth.py`
- Serializers: `backend/apps/users/serializers/auth.py`
- Auth service: `backend/apps/users/services/auth_service.py`
- JWT auth class: `backend/apps/users/services/authentication.py`
- Permission helpers: `backend/core/permissions.py`
- Models: `backend/apps/users/models/user.py`, `backend/apps/users/models/oauth.py`

## Exposed APIs

- `POST /api/auth/register/`
- `POST /api/auth/email/verify-otp/`
- `POST /api/auth/login/`
- `POST /api/auth/google/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

## Backend flow summary

- Register:
  - validates payload
  - hashes password with salt + sha256
  - creates signed verification token with OTP payload
  - attempts email send
  - does not create DB user until OTP verify succeeds
- Verify OTP:
  - validates signed token with 10 minute max age
  - creates user
  - returns access, refresh, user
- Password login:
  - accepts email or phone as `identifier`
  - rejects users with no password hash and directs them to Google login
- Google login:
  - accepts Google credential or access token
  - verifies token with Google
  - creates user and OAuthAccount if needed

## Client state behavior

- Zustand store is the active auth state consumed by the app.
- Store persists `user` and `isAuthenticated` under localStorage key `metro.user`.
- Access and refresh tokens are separately stored under:
  - `metro.access`
  - `metro.refresh`
- Logout clears local tokens even if backend revoke call fails.

## JWT and permission behavior

- Backend sets DRF default auth to custom JWT authentication class.
- Many permission checks and `me` endpoint logic read `request.auth.payload["user_id"]`.
- Admin access depends on `User.is_admin`, not Django staff/superuser flags.

## Rate limit behavior

- Register: 3 requests / 60s per IP
- Verify OTP: 10 / 60s
- Login: 5 / 60s
- Google login: 10 / 60s
- Limiter fails open if Redis is unavailable.

## Gotchas

- Frontend axios refresh logic expects `POST /auth/login/refresh/`, but backend does not currently expose this route.
- Two auth implementations coexist on frontend; prefer the Zustand-based path unless intentionally cleaning up legacy code.
- Password hashing is custom in service code, not Django's standard auth framework.
- `GET /api/auth/me/` depends on token payload contents, so token shape changes can break permission checks quickly.
