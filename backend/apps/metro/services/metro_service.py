"""
apps/metro/services/metro_service.py
──────────────────────────────────────
Metro data changes very rarely (new stations/lines require a deploy).
Use WARM TTL (30 min) caching.  Cache invalidation can be done manually
via Django admin or management command by deleting the key.

Key pattern: hcmc_metro:<version>:metro:lines:all
"""
from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from django.core.cache import cache

from apps.metro.models import MetroLine

logger = logging.getLogger(__name__)

_LINES_KEY = "metro:lines:all"


class MetroService:
    def get_all_lines(self) -> list[dict[str, Any]]:
        """
        Returns all metro lines with related stations.
        Cached with WARM TTL (30 min).  Cache stores plain dicts to avoid pickle.
        """
        cached = cache.get(_LINES_KEY)
        if cached is not None:
            return cached  # type: ignore[return-value]

        # select_related / prefetch stations to avoid N+1
        lines = MetroLine.objects.prefetch_related("stations").all()
        result = []
        for line in lines:
            stations = []
            for st in line.stations.all():
                station_data: dict[str, Any] = {"id": st.pk, "name": st.name}
                # Add optional fields if they exist on the model
                for field in ("order", "latitude", "longitude", "is_interchange"):
                    if hasattr(st, field):
                        station_data[field] = getattr(st, field)
                stations.append(station_data)

            line_data: dict[str, Any] = {
                "id": line.pk,
                "name": line.name,
                "stations": stations,
            }
            # Add optional fields if they exist on MetroLine
            for field in ("color", "status", "total_length_km"):
                if hasattr(line, field):
                    line_data[field] = getattr(line, field)
            result.append(line_data)

        ttl: int = getattr(settings, "CACHE_TTL_WARM", 1800)
        cache.set(_LINES_KEY, result, ttl)
        logger.debug("MetroService.get_all_lines: cached %d lines", len(result))
        return result

    def invalidate_lines_cache(self) -> None:
        """Call this after any admin change to metro lines/stations."""
        cache.delete(_LINES_KEY)
        logger.info("MetroService: lines cache invalidated")
