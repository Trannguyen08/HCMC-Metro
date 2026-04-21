from .base import *

DEBUG = False

ALLOWED_HOSTS = ["*", "backend", "project_backend", "localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000", "http://127.0.0.1:3000"])
CORS_ALLOW_CREDENTIALS = True

# Database Configuration
DATABASE_URL = env("DATABASE_URL", default=None)

if DATABASE_URL:
    DATABASES = {
        "default": env.db("DATABASE_URL"),
    }
else:
    # Fail safe or typical prod defaults
    DATABASES = {}

# Ensure secure cookies in production based on env, default to False so local tests don't break
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=False)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=False)
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
APPEND_SLASH = False

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000", "http://127.0.0.1:3000"])
USE_X_FORWARDED_HOST = False
USE_X_FORWARDED_PORT = False
