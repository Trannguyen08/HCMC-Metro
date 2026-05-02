"""
apps/news/services/news_service.py
────────────────────────────────────
NewsService with Redis caching:
  - News list (HOT TTL = 5 min):  cache.get/set with structured key
  - News detail by slug (HOT):    cache.get/set
  - Categories (WARM TTL = 30 min): rarely changes
  - Cache invalidation on write:  delete affected keys on create/update/delete
  - Serialization: JSON (via django-redis JSONSerializer) — safe for all fields
  - Graceful fallback: if Redis is down, IGNORE_EXCEPTIONS=True means cache
    always returns None (miss) and the query runs normally

Key pattern:
  hcmc_metro:<version>:news:list:<params_hash>
  hcmc_metro:<version>:news:detail:<slug>
  hcmc_metro:<version>:news:categories
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Optional

from django.core.cache import cache
from django.conf import settings
from django.db.models import Q, QuerySet

from apps.news.models import News, NewsCategory

logger = logging.getLogger(__name__)

# ── Cache key builders ────────────────────────────────────────────────────────
_NS = "news"


def _list_key(
    category: Optional[str],
    search: Optional[str],
    exclude_id: Optional[str],
    offset: int,
    limit: int,
) -> str:
    """Deterministic key for a news-list query."""
    params = json.dumps(
        {"cat": category, "q": search, "excl": exclude_id, "off": offset, "lim": limit},
        sort_keys=True,
    )
    digest = hashlib.md5(params.encode()).hexdigest()[:12]
    return f"{_NS}:list:{digest}"


def _detail_key(slug: str) -> str:
    return f"{_NS}:detail:{slug}"


def _categories_key() -> str:
    return f"{_NS}:categories"


# ── Service ───────────────────────────────────────────────────────────────────

class NewsService:
    """
    Service layer for News CRUD.
    Public read methods cache results; write methods invalidate relevant keys.
    """

    # ── Reads (cached) ────────────────────────────────────────────────────────

    def get_published_news(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        exclude_id: Optional[str] = None,
        offset: int = 0,
        limit: int = 10,
    ) -> list[dict]:
        """
        Returns published news as a list of dicts (JSON-serializable, cache-safe).
        TTL: CACHE_TTL_HOT (5 min) — news updates frequently.

        ⚠️  Cache stampede note: since TTLs are short (5 min) and reads are
        spread across many keys (one per param combo), stampede risk is low.
        For very high traffic, consider probabilistic early expiry or locks.
        """
        try:
            offset = int(offset)
            limit = int(limit)
        except (ValueError, TypeError):
            offset, limit = 0, 10

        cache_key = _list_key(category, search, exclude_id, offset, limit)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        qs: QuerySet = News.objects.filter(is_published=True).order_by("-published_at")

        if category:
            if category.isdigit():
                qs = qs.filter(category_id=category)
            else:
                qs = qs.filter(category__slug=category)

        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(summary__icontains=search))

        if exclude_id:
            try:
                qs = qs.exclude(id=exclude_id)
            except (ValueError, TypeError):
                pass

        qs = qs.select_related("category")[offset : offset + limit]

        # Convert to list of dicts for JSON serialization
        result = self._serialize_news_list(qs)
        ttl: int = getattr(settings, "CACHE_TTL_HOT", 300)
        cache.set(cache_key, result, ttl)
        return result

    def get_news_detail_by_slug(self, slug_or_id: str) -> Optional[News]:
        """
        Fetches a single published article. Supports both raw slug and {uuid}-{slug} format.
        A UUID is always exactly 36 characters (8-4-4-4-12 with dashes).
        """
        cache_key = _detail_key(slug_or_id)
        pk = cache.get(cache_key)
        if pk is not None:
            try:
                return News.objects.get(pk=pk, is_published=True)
            except News.DoesNotExist:
                cache.delete(cache_key)
                return None

        import uuid as uuid_module
        news = None

        # 1. If long enough, try first 36 chars as UUID
        if len(slug_or_id) >= 36:
            potential_uuid = slug_or_id[:36]
            try:
                uuid_module.UUID(potential_uuid)  # validate format
                news = News.objects.filter(pk=potential_uuid, is_published=True).first()
            except (ValueError, Exception):
                pass

        # 2. Try as a direct exact UUID (bare /tin-tuc/{uuid})
        if not news and len(slug_or_id) == 36:
            try:
                news = News.objects.filter(pk=slug_or_id, is_published=True).first()
            except Exception:
                pass

        # 3. Try by exact slug (legacy / direct slug lookup)
        if not news:
            news = News.objects.filter(slug=slug_or_id, is_published=True).first()

        # 4. Extract slug part: when format is {uuid_or_prefix}-{slug},
        #    the slug starts after the first 37 chars (36-char UUID + 1 dash).
        #    Also try from position 38 onward in case UUID has extra chars.
        if not news and len(slug_or_id) > 37:
            for offset in [37, 38, 36]:
                if offset < len(slug_or_id):
                    slug_part = slug_or_id[offset:]
                    news = News.objects.filter(slug=slug_part, is_published=True).first()
                    if news:
                        break

        if news:
            ttl: int = getattr(settings, "CACHE_TTL_HOT", 300)
            cache.set(cache_key, news.pk, ttl)
        return news

    def get_all_categories(self) -> list[dict]:
        """
        Returns all categories as list of dicts.
        TTL: WARM (30 min) — categories change very rarely.
        """
        cache_key = _categories_key()
        cached = cache.get(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        qs = NewsCategory.objects.all()
        result = list(qs.values("id", "name", "slug"))
        ttl: int = getattr(settings, "CACHE_TTL_WARM", 1800)
        cache.set(cache_key, result, ttl)
        return result

    # ── Admin reads (uncached — always fresh) ────────────────────────────────

    def get_all_news_admin(self) -> QuerySet:
        return News.objects.all().order_by("-created_at")

    def get_news_by_id(self, pk: Any) -> Optional[News]:
        try:
            return News.objects.get(pk=pk)
        except News.DoesNotExist:
            return None

    # ── Writes (with cache invalidation) ─────────────────────────────────────

    def create_news(self, validated_data: dict) -> News:
        news = News.objects.create(**validated_data)
        self._invalidate_list_cache()
        self._invalidate_categories_if_needed(validated_data)
        logger.debug("NewsService.create_news: invalidated list cache")
        return news

    def update_news(self, news: News, validated_data: dict) -> News:
        old_slug = news.slug
        for key, value in validated_data.items():
            setattr(news, key, value)
        news.save()
        # Invalidate the specific detail entry and the list
        cache.delete(_detail_key(old_slug))
        if news.slug != old_slug:
            cache.delete(_detail_key(news.slug))
        self._invalidate_list_cache()
        logger.debug("NewsService.update_news: invalidated cache for slug=%s", old_slug)
        return news

    def delete_news(self, news: News) -> None:
        slug = news.slug
        news.delete()
        cache.delete(_detail_key(slug))
        self._invalidate_list_cache()
        logger.debug("NewsService.delete_news: invalidated cache for slug=%s", slug)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _invalidate_list_cache(self) -> None:
        """
        Delete all list cache keys by bumping the global cache version.
        django-redis's KEY_PREFIX + VERSION means all old keys become orphans
        (they expire naturally via TTL).  Alternatively, use cache.clear() —
        but that nukes everything.  Here we use a versioned-key pattern:
        simply delete a sentinel to signal staleness.

        For a full pattern-based delete (e.g. hcmc_metro:news:list:*),
        use django_redis.cache.get_redis_connection("default") with SCAN+DEL
        to avoid KEYS command in production.
        """
        try:
            from django_redis import get_redis_connection
            r = get_redis_connection("default")
            # SCAN-based deletion: safe in production (no KEYS blocking)
            cursor = 0
            pattern = "*:news:list:*"
            while True:
                cursor, keys = r.scan(cursor, match=pattern, count=100)
                if keys:
                    r.delete(*keys)
                if cursor == 0:
                    break
        except Exception as exc:
            logger.warning("Cache invalidation warning (non-fatal): %s", exc)

    def _invalidate_categories_if_needed(self, data: dict) -> None:
        if "category" in data or "category_id" in data:
            cache.delete(_categories_key())

    @staticmethod
    def _serialize_news_list(qs: QuerySet) -> list[dict]:
        """Convert queryset to JSON-serializable list (no pickle)."""
        result = []
        for n in qs:
            result.append({
                "id": n.pk,
                "title": n.title,
                "slug": n.slug,
                "summary": n.summary,
                "image_url": n.image_url if hasattr(n, "image_url") else None,
                "published_at": n.published_at.isoformat() if n.published_at else None,
                "category_id": n.category_id,
                "category_name": n.category.name if n.category_id else None,
            })
        return result
