---
name: hcmc-metro-codebase
description: Use when working inside the HCMC-Metro repository to avoid re-reading the whole codebase. Covers the monorepo layout, frontend/backend architecture, Vietnamese route map, API ownership, database source of truth, auth/cache behavior, mock fallbacks, and known inconsistencies for metro, news, auth, admin, Docker, and schema tasks.
---

# HCMC Metro Codebase

Use this file as the first-pass router for the repo. Keep this file loaded, then read only the specific reference file needed for the current task.

## Repo shape

- `frontend/`: Next.js 14 App Router, TypeScript, Tailwind.
- `backend/`: Django 5 + DRF + SimpleJWT.
- `database/schema.sql`: real schema definition and seed data.
- `docker-compose.yml`: Postgres, Redis, pgAdmin, backend, frontend.
- `references/`: domain-specific notes for progressive disclosure

## High-value rules

- Treat `database/schema.sql` as the data-model source of truth.
- Notice that most Django models use `managed = False`; do not assume Django migrations own these tables.
- Do not bulk-load every reference file; open only the relevant domain note.
- Expect Vietnamese user-facing routes and labels.

## Known inconsistencies and traps

- Two frontend auth stacks coexist:
  - active path in UI: Zustand store + `features/auth/hooks/use-auth.ts`
  - older parallel path: `src/lib/auth.tsx`
- Two axios clients coexist:
  - `src/services/api-client.ts`
  - `src/lib/api.ts`
- Frontend token refresh expects `POST /auth/login/refresh/`, but this route is not wired in `backend/config/urls.py`.
- Many frontend screens look production-ready but still use mock data or placeholder bodies.
- File `backend/apps/metro/views/aminity.py` is intentionally misspelled; do not "fix imports" blindly without updating callers.
- Dynamic App Router folders contain `(` `)` and `[]`; in PowerShell use `-LiteralPath` or quoted paths.

## Domain routing

- Metro tasks:
  - Read `references/metro.md`
  - Use for amenities, stations, map, route lookup, and metro admin
- News tasks:
  - Read `references/news.md`
  - Use for list/detail/category behavior, cache, and admin news CRUD
- Auth tasks:
  - Read `references/auth.md`
  - Use for login, register, OTP verify, Google auth, JWT state, and permission issues
- Admin tasks:
  - Read `references/admin.md`
  - Use for admin shell, stats, users, admin APIs, and real-vs-mock admin behavior
- Schema or data-model tasks:
  - Read `database/schema.sql` first
  - Then open the related model, serializer, and view files only

## Useful commands

- Frontend dev: `npm run dev` from `frontend/`
- Frontend lint: `npm run lint` from `frontend/`
- Backend dev: `python manage.py runserver` from `backend/`
- Backend tests: `python manage.py test`
- Docker stack: `docker compose up --build`

## Testing reality

- Backend has limited tests; notable existing coverage is around news cache.
- Frontend has no dedicated test suite configured in this repo snapshot.
- Verify behavior manually after changes, especially in metro/admin/auth flows.
