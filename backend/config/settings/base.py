import os
from pathlib import Path
from dotenv import load_dotenv
import environ
from datetime import timedelta

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR is expected to be c:\HCMC-Metro\backend (since settings is in config/settings/base.py)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, True),
)
DEBUG = True
APPEND_SLASH = False

env_files = [
    BASE_DIR / ".env",
    BASE_DIR.parent / ".env",
]
for env_file in env_files:
    if env_file.exists():
        env.read_env(env_file)

# ---------------------------------------------------------------------------
# Database Configuration
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://postgres:postgres@db:5432/postgres")
}

SECRET_KEY = env("SECRET_KEY", default="change-me")

# Default apps mapping
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",

    # Project Apps
    "apps.users",
    "apps.metro",
    "apps.ticketing",
    "apps.payments",
    "apps.news",
    "apps.chatbox",
    "django_celery_results",
    "django_celery_beat",
    "drf_spectacular",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.chatbox.middleware.ChatboxGuardMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# JWT Auth Customization placeholder for when we create users app auth hook
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.users.services.authentication.CustomJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Google OAuth
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")

# Email Settings
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="HCMC Metro <noreply@metrohcm.vn>")

# ---------------------------------------------------------------------------
# Redis Configuration
# ---------------------------------------------------------------------------
# Pull from env; fallback to localhost so the app still starts without Redis.
# In docker-compose the service is named "redis" → REDIS_URL=redis://redis:6379/0
REDIS_URL: str = env("REDIS_URL", default="redis://localhost:6379/0")

# CACHES — primary cache backed by Redis (via django-redis).
# Uses a shared ConnectionPool (max_connections=50) so we never create a new
# TCP connection per request.  KEY_PREFIX namespaces every key with the app name.
# SOCKET_CONNECT_TIMEOUT / SOCKET_TIMEOUT give us graceful degradation:
# if Redis is down, cache operations raise ConnectionError which we catch in helpers.
_REDIS_AVAILABLE = False
try:
    import redis as _redis_lib
    _pool = _redis_lib.ConnectionPool.from_url(
        REDIS_URL,
        max_connections=50,
        socket_connect_timeout=1,
        socket_timeout=1,
    )
    _ping_client = _redis_lib.Redis(connection_pool=_pool)
    _ping_client.ping()
    _REDIS_AVAILABLE = True
except Exception:
    pass  # Redis not reachable at settings-load time — use LocMemCache fallback

if _REDIS_AVAILABLE:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "KEY_PREFIX": "hcmc_metro",   # namespace: hcmc_metro:<version>:<key>
            "VERSION": 1,                 # bump VERSION to invalidate all keys at once
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_KWARGS": {
                    "max_connections": 50,
                    "socket_connect_timeout": 1,
                    "socket_timeout": 1,
                },
                # Use JSON serializer — safe for user-originated data (no pickle).
                # django-redis bundles this; falls back to pickle only for complex types.
                "SERIALIZER": "django_redis.serializers.json.JSONSerializer",
                # Ignore Redis errors → cache miss instead of 500.
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
    # Session stored in Redis (DB 0, separate key prefix avoids collision).
    # Falls back to DB session automatically if CACHES["default"] is unavailable.
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    # Graceful degradation: in-process memory cache (dev / Redis-down scenario).
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "hcmc-metro-fallback",
        }
    }
    # Fallback: use DB-backed sessions so no data is lost.
    SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Cache TTL constants (seconds) — referenced by services/views.
CACHE_TTL_HOT = 60 * 5          # 5 min  — news list, categories (changes often)
CACHE_TTL_WARM = 60 * 30        # 30 min — metro lines/stations (changes rarely)
CACHE_TTL_COLD = 60 * 60 * 24  # 24 h   — static reference data

# PayOS Settings
PAYOS_CLIENT_ID = env("PAYOS_CLIENT_ID", default="")
PAYOS_API_KEY = env("PAYOS_API_KEY", default="")
PAYOS_CHECKSUM_KEY = env("PAYOS_CHECKSUM_KEY", default="")
PAYOS_API_BASE = env("PAYOS_API_BASE", default="https://api-merchant.payos.vn")

# Groq AI Settings (dùng cho Chatbox AI)
GROQ_API_KEY = env("GROQ_API_KEY", default="")
GROQ_MODEL = env("GROQ_MODEL", default="llama-3.3-70b-versatile")
MAX_TOKENS = env.int("MAX_TOKENS", default=800)

# ---------------------------------------------------------------------------
# Celery Configuration
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="amqp://guest:guest@rabbitmq:5672//")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://redis:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# ---------------------------------------------------------------------------
# Spectacular Settings (Swagger/OpenAPI)
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "HCMC Metro API",
    "DESCRIPTION": "API documentation for HCMC Metro system including Ticketing, Metro Lines, News, and Chatbox.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
        "displayOperationId": True,
    },
}
