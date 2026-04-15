from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*", "backend", "project_backend", "localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[
    "http://127.0.0.1:3000", 
    "http://localhost:3000",
])
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

USE_X_FORWARDED_HOST = False
USE_X_FORWARDED_PORT = False
APPEND_SLASH = False
SECURE_SSL_REDIRECT = False

# Database Configuration (Development often uses Dockerized postgres like before)
DATABASE_URL = env("DATABASE_URL", default=None)

if DATABASE_URL:
    DATABASES = {
        "default": env.db("DATABASE_URL"),
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="postgres"),
            "USER": env("DB_USER", default="postgres"),
            "PASSWORD": env("DB_PASSWORD", default="postgres"),
            "HOST": env("DB_HOST", default="db"),
            "PORT": env("DB_PORT", default="5432"),
        }
    }

