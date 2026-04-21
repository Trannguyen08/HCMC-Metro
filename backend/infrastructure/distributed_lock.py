"""
infrastructure/distributed_lock.py
────────────────────────────────────
Redis-backed distributed lock using redis-py's built-in Lock primitive.
Prevents race conditions in critical sections (e.g., ticket booking).

Key pattern:
  hcmc_metro:lock:<resource_name>
"""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator, Optional

from .redis_client import get_redis

logger = logging.getLogger(__name__)


@contextmanager
def acquire_lock(
    resource: str,
    timeout: float = 10.0,
    blocking_timeout: float = 5.0,
) -> Generator[bool, None, None]:
    """
    Context manager that acquires a distributed Redis lock.

    Args:
        resource:         Unique name for the protected resource,
                          e.g. "ticket:booking:user_42".
        timeout:          How long (s) the lock is held before auto-release.
                          Prevents deadlocks if the holder crashes.
        blocking_timeout: How long (s) to wait to acquire the lock before
                          giving up.

    Yields:
        True  — lock was acquired; the block runs exclusively.
        False — could not acquire the lock (another instance holds it,
                or Redis is down).  Caller should handle this gracefully.

    Usage::
        with acquire_lock("ticket:booking:trip_7") as acquired:
            if not acquired:
                return Response({"detail": "Hệ thống bận, thử lại."}, 503)
            # ... safe to run single-instance logic here ...
    """
    r = get_redis()
    if r is None:
        # Redis down → yield False so caller can decide to proceed or reject
        logger.warning("Distributed lock: Redis unavailable for resource '%s'", resource)
        yield False
        return

    lock_key = f"hcmc_metro:lock:{resource}"
    lock = r.lock(
        lock_key,
        timeout=timeout,          # auto-expire (prevents deadlock)
        blocking_timeout=blocking_timeout,
    )

    acquired = False
    try:
        acquired = lock.acquire(blocking=True)
        yield acquired
    except Exception as exc:
        logger.warning("Distributed lock error for '%s': %s", resource, exc)
        yield False
    finally:
        if acquired:
            try:
                lock.release()
            except Exception as exc:
                # Lock may have expired already — safe to ignore
                logger.debug("Lock release warning for '%s': %s", resource, exc)
