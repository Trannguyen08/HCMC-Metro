# HCMC Metro Memory

Start here before reading source. This file is the short operational memory for the repo.

## Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind, Radix UI, Zustand.
- Backend: Django 5, DRF, SimpleJWT, Redis cache/rate limit, Postgres.
- Infra: Docker Compose with `db`, `redis`, `pgadmin`, `backend`, `frontend`.

## Source of truth

- Database structure lives in `database/schema.sql`.
- Django models mostly mirror existing tables with `managed = False`.
- Frontend metro data may come from API or fallback mocks in `frontend/src/lib/mock.ts`.

## User-facing route map

- `"/"`: home
- `"/tien-ich"`: amenity list
- `"/tien-ich/[id]"`: amenity detail
- `"/tin-tuc"`: news list
- `"/tin-tuc/[slug]"`: news detail
- `"/ban-do-so"`: metro map
- `"/lo-trinh"`: route lookup
- `"/profile"`: profile
- `"/login"`, `"/register"`, `"/verify-email"`: auth
- `"/admin/*"`: admin shell and dashboards

## Frontend modules

- Metro: `frontend/src/features/metro/*`
- News: `frontend/src/features/news/*`
- Auth: `frontend/src/features/auth/*`
- Shared UI: `frontend/src/components/ui/*`
- Current auth consumption path: `frontend/src/features/auth/hooks/use-auth.ts` → Zustand store (sole auth mechanism)
- API client: `frontend/src/lib/api.ts` (single source of truth)

## Backend modules

- Users/auth: `backend/apps/users/*`
- Metro: `backend/apps/metro/*`
- News: `backend/apps/news/*`
- Core dashboard/upload/health: `backend/core/*`

## Detailed references

- Metro: `references/metro.md`
- News: `references/news.md`
- Auth: `references/auth.md`
- Admin: `references/admin.md`
- Open only the domain file needed for the task.

## What is real vs mock

- Amenity pages are partially real but can silently fall back to mock data.
- News list/detail hits real backend APIs, but detail body content is still placeholder.
- Profile and parts of admin use client-side or mock presentation data.
- Dashboard revenue is hard-coded in the service.

## Important gotchas

- There are duplicate auth approaches:
  - active: Zustand store
  - older (removed): `frontend/src/lib/auth.tsx`
- Frontend refresh flow calls `/auth/login/refresh/`, but backend does not expose that route today.
- Backend permissions often use `request.auth.payload["user_id"]`, not `request.user`.
- Public DRF endpoints must opt out of global auth with `AllowAny`.

## Read only what you need

- Amenity bug/change: open metro service, hook, target component, and metro backend view/serializer.
- News bug/change: open news frontend service/component and news backend view/service.
- Auth bug/change: open auth store, API client, users auth view, auth service.
- DB/schema task: open `database/schema.sql` first, then the related model/serializer/view.

## Practical commands

- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && python manage.py runserver`
- Docker: `docker compose up --build`

## Default working assumptions

- Prefer Vietnamese UI copy unless the task asks otherwise.
- Preserve existing route slugs and API shapes unless the task explicitly changes them.
- Be careful not to mistake mock behavior for completed backend functionality.
