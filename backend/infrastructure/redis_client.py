"""
infrastructure/redis_client.py
──────────────────────────────
Singleton Redis client built on a shared ConnectionPool.
All application code should import `get_redis` from here instead of
creating raw redis.Redis() instances per-request.

Key naming convention used across the project:
  hcmc_metro:<app>:<model>:<id>:<field>
  e.g.  hcmc_metro:news:article:42:detail
        hcmc_metro:metro:lines:all
        hcmc_metro:rate_limit:<ip>:<endpoint>
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator, Optional

import redis
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Shared connection pool ───────────────────────────────────────────────────
# Created lazily once; reused for every request (no per-request TCP overhead).
_pool: Optional[redis.ConnectionPool] = None


def _build_pool() -> Optional[redis.ConnectionPool]:
    """Build the global pool.  Returns None if Redis is unreachable."""
    global _pool
    if _pool is not None:
        return _pool
    try:
        _pool = redis.ConnectionPool.from_url(
            getattr(settings, "REDIS_URL", "redis://localhost:6379/0"),
            max_connections=50,
            socket_connect_timeout=1,  # fail fast so we fall back quickly
            socket_timeout=1,
            decode_responses=True,     # always return str, not bytes
        )
        return _pool
    except Exception as exc:
        logger.warning("Redis pool creation failed: %s", exc)
        return None


def get_redis() -> Optional[redis.Redis]:
    """
    Return a Redis client that shares the global connection pool.
    Returns None when Redis is unavailable so callers can degrade gracefully.
    """
    pool = _build_pool()
    if pool is None:
        return None
    try:
        client = redis.Redis(connection_pool=pool)
        client.ping()
        return client
    except (redis.RedisError, Exception) as exc:
        logger.warning("Redis unavailable: %s", exc)
        return None


@contextmanager
def redis_or_none() -> Generator[Optional[redis.Redis], None, None]:
    """
    Context-manager wrapper for Redis.  Yields the client or None.
    Catches all Redis errors inside the block so callers never crash.

    Usage::
        with redis_or_none() as r:
            if r:
                r.set("key", "val")
    """
    client = get_redis()
    try:
        yield client
    except (redis.RedisError, Exception) as exc:
        logger.warning("Redis error (suppressed): %s", exc)
