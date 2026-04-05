# Admin Domain Reference

Read this file for admin shell, admin APIs, and the split between real data and mock admin UI.

## Scope

- Admin layout and route guards
- Admin dashboard stats
- Admin users
- Admin metro and amenities
- Admin news

## Frontend ownership

- Admin layout shell: `frontend/src/app/(routes)/admin/layout.tsx`
- Dashboard page: `frontend/src/app/(routes)/admin/page.tsx`
- Other route pages:
  - `frontend/src/app/(routes)/admin/users/page.tsx`
  - `frontend/src/app/(routes)/admin/metro/page.tsx`
  - `frontend/src/app/(routes)/admin/amenities/page.tsx`
  - `frontend/src/app/(routes)/admin/news/page.tsx`
  - `frontend/src/app/(routes)/admin/tickets/page.tsx`

## Backend ownership

- Admin stats route: `backend/core/views/dashboard.py`
- Admin permissions: `backend/core/permissions.py`
- Admin users route: `backend/apps/users/views/admin.py`
- Admin metro routes: `backend/apps/metro/views/admin.py`
- Admin news routes: `backend/apps/news/views/news.py`
- Dashboard stats service: `backend/core/services/dashboard_service.py`
- User admin service: `backend/apps/users/services/user_service.py`

## Route guard behavior

- Frontend admin layout uses `useAuth()` from the Zustand-based auth stack.
- If unauthenticated, it redirects to `/login`.
- If authenticated but `user.is_admin` is false, it redirects to `/`.
- UI guard is client-side only; real enforcement still depends on backend permissions.

## Backend permission behavior

- Admin APIs use custom `IsAdminUser`.
- Permission checks fetch `user_id` from JWT payload and then query `User.is_admin`.
- This is separate from Django admin/staff concepts.

## Main admin APIs

- Stats:
  - `GET /api/admin/stats/`
- Users:
  - `GET /api/admin/users/`
- Metro:
  - `GET /api/admin/lines/`
  - `GET /api/admin/amenity-types/`
  - `GET /api/admin/amenities/`
  - `POST /api/admin/amenities/create/`
  - `GET|PUT|DELETE /api/admin/amenities/<uuid>/`
- News:
  - `GET /api/admin/news/`
  - `POST /api/admin/news/create/`
  - `GET|PUT|DELETE /api/admin/news/<uuid>/`

## What is real vs mock

- Dashboard stats call a real backend endpoint, but `revenue_vnd` is hard-coded in `DashboardService`.
- Dashboard charts and alert cards are mostly presentation/mock.
- Users admin reads real user data.
- Amenities admin has real CRUD endpoints.
- News admin has real CRUD endpoints with cache invalidation.
- Tickets admin appears present in routing/UI, but ticketing management is not fully built out here.

## Metro admin behavior

- Amenity list supports filters:
  - `search`
  - `station`
  - `category`
  - `is_active`
- Create and update use `AdminAmenitySerializer`.
- Serializer writes station by station code and amenity type by primary key.

## News admin behavior

- Admin list is uncached and always fresh.
- Writes invalidate public cache through `NewsService`.

## Gotchas

- If admin behavior looks correct in UI but fails on API, inspect JWT payload and `is_admin` first.
- Frontend admin shell may hide pages before backend errors are visible, so test APIs directly when debugging.
- Some admin pages may present polished UI even when backend coverage is incomplete.
