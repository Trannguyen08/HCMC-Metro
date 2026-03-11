Create a fullstack project with the following structure and configuration:

## Tech Stack
- Frontend: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Backend: Django 5 + Django REST Framework
- Containerization: Docker + Docker Compose
- Environment: .env files for each service

---

## Project Structure
```
project-root/
├── frontend/          # Next.js app
├── backend/           # Django app
├── docker-compose.yml
├── .gitignore
└── .env.example
```

---

## Requirements

### 1. Frontend (frontend/)
- Next.js 14 with App Router and TypeScript
- Tailwind CSS configured
- Axios or fetch wrapper for calling backend API
- .env.local with:
  - NEXT_PUBLIC_API_URL=http://localhost:8000/api

### 2. Backend (backend/)
- Django 5 + Django REST Framework
- django-cors-headers configured to allow frontend origin
- PostgreSQL as database (via psycopg2-binary)
- python-decouple or django-environ to read .env
- .env with:
  - SECRET_KEY
  - DEBUG
  - DATABASE_URL or individual DB_* vars
  - ALLOWED_HOSTS
  - CORS_ALLOWED_ORIGINS

### 3. Docker
- frontend/Dockerfile — node:18-alpine, runs `next dev` in development
- backend/Dockerfile — python:3.12-slim, runs django dev server
- docker-compose.yml with 3 services:
  - db: postgres:16-alpine, volume for data persistence
  - backend: depends_on db, reads from backend/.env
  - frontend: depends_on backend, reads from frontend/.env.local
- All services on the same docker network

### 4. .gitignore (root level)
Ignore:
- .env, .env.local, .env.*.local
- __pycache__, *.pyc, .pytest_cache
- node_modules, .next
- .DS_Store
- postgres data volume

### 5. .env.example (root level)
Provide a sample .env.example showing all required variables for both services with placeholder values.

---

## After generating all files, show me:
1. How to start the project with Docker: `docker compose up --build`
2. How to run migrations: `docker compose exec backend python manage.py migrate`
3. How to create a Django superuser
4. URL of frontend (localhost:3000) and backend API (localhost:8000/api)