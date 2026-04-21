"""
infrastructure/rate_limit.py
─────────────────────────────
Fixed-window rate limiter backed by Redis.

Key pattern:
  hcmc_metro:rate_limit:<identifier>:<window_ts>

Falls back gracefully (allows request) when Redis is unavailable so the
app does not reject traffic during a Redis outage.
"""
from __future__ import annotations

import functools
import logging
import time
from typing import Callable, Optional

from django.http import JsonResponse

from .redis_client import get_redis

logger = logging.getLogger(__name__)

# ── Core limiter ──────────────────────────────────────────────────────────────

def is_rate_limited(
    identifier: str,
    limit: int = 60,
    window_seconds: int = 60,
) -> tuple[bool, int, int]:
    """
    Fixed-window rate limiter.

    Args:
        identifier:     Unique key for the requester, e.g. "ip:192.168.1.1:login"
        limit:          Max allowed requests per window.
        window_seconds: Length of the time window in seconds.

    Returns:
        (limited, current_count, retry_after_seconds)
        - limited: True if the caller has exceeded the limit.
        - current_count: How many requests in this window so far.
        - retry_after_seconds: Seconds until the window resets (0 if not limited).
    """
    r = get_redis()
    if r is None:
        # Redis down → fail open (allow the request, log a warning)
        logger.warning("Rate limiter: Redis unavailable, skipping limit check for %s", identifier)
        return False, 0, 0

    # Window key: bucket resets every `window_seconds`
    window_ts = int(time.time()) // window_seconds
    redis_key = f"hcmc_metro:rate_limit:{identifier}:{window_ts}"

    try:
        pipe = r.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, window_seconds)
        results = pipe.execute()
        current_count: int = results[0]

        if current_count > limit:
            retry_after = window_seconds - (int(time.time()) % window_seconds)
            return True, current_count, retry_after

        return False, current_count, 0

    except Exception as exc:
        logger.warning("Rate limiter Redis error (fail open): %s", exc)
        return False, 0, 0


# ── Decorator ─────────────────────────────────────────────────────────────────

def rate_limit(
    limit: int = 60,
    window_seconds: int = 60,
    key_func: Optional[Callable] = None,
) -> Callable:
    """
    Decorator for DRF api_view functions.

    By default uses the client IP as the identifier.
    Pass a custom `key_func(request) -> str` for user-based limiting.

    Usage::
        @api_view(["POST"])
        @rate_limit(limit=5, window_seconds=60)
        def login(request): ...
    """
    def decorator(view_func: Callable) -> Callable:
        @functools.wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if key_func:
                identifier = key_func(request)
            else:
                # Use X-Forwarded-For first (behind a proxy/Nginx), else REMOTE_ADDR.
                xff = request.META.get("HTTP_X_FORWARDED_FOR")
                ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "unknown")
                view_name = view_func.__name__
                identifier = f"ip:{ip}:{view_name}"

            limited, count, retry_after = is_rate_limited(identifier, limit, window_seconds)
            if limited:
                return JsonResponse(
                    {
                        "detail": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
                        "retry_after": retry_after,
                    },
                    status=429,
                )
            return view_func(request, *args, **kwargs)

        return _wrapped
    return decorator
