"""
apps/news/tests/test_news_cache.py
────────────────────────────────────
Unit tests for Redis-backed NewsService caching.
Uses unittest.mock to avoid needing a live Redis instance.

Run with:
  python manage.py test apps.news.tests.test_news_cache
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch, call
from django.test import TestCase, override_settings

# Use a dummy locmem cache so tests don't need Redis
DUMMY_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}


@override_settings(CACHES=DUMMY_CACHES, CACHE_TTL_HOT=300, CACHE_TTL_WARM=1800)
class NewsServiceCacheTest(TestCase):
    """Tests for NewsService caching behaviour."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    # ── get_published_news ─────────────────────────────────────────────────────

    @patch("apps.news.services.news_service.News.objects")
    def test_first_call_hits_db(self, mock_objects):
        """First call should query the database."""
        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.select_related.return_value = []
        mock_qs.__getitem__ = lambda self, s: []
        mock_objects.filter.return_value = mock_qs

        from apps.news.services.news_service import NewsService
        svc = NewsService()
        svc.get_published_news()

        mock_objects.filter.assert_called_once_with(is_published=True)

    @patch("apps.news.services.news_service.News.objects")
    def test_second_call_hits_cache(self, mock_objects):
        """Second identical call should use cache (DB not queried again)."""
        from django.core.cache import cache as django_cache
        from apps.news.services.news_service import NewsService, _list_key

        # Pre-populate cache
        key = _list_key(None, None, None, 0, 10)
        django_cache.set(key, [{"id": 1, "title": "Cached"}], 300)

        svc = NewsService()
        result = svc.get_published_news()

        # DB should NOT have been hit
        mock_objects.filter.assert_not_called()
        self.assertEqual(result, [{"id": 1, "title": "Cached"}])

    # ── cache invalidation ─────────────────────────────────────────────────────

    @patch("apps.news.services.news_service.NewsService._invalidate_list_cache")
    @patch("apps.news.services.news_service.News.objects")
    def test_create_invalidates_cache(self, mock_objects, mock_invalidate):
        """create_news() should call cache invalidation."""
        mock_objects.create.return_value = MagicMock()
        from apps.news.services.news_service import NewsService
        svc = NewsService()
        svc.create_news({"title": "New article"})
        mock_invalidate.assert_called_once()

    @patch("apps.news.services.news_service.NewsService._invalidate_list_cache")
    def test_delete_invalidates_cache(self, mock_invalidate):
        """delete_news() should call cache invalidation."""
        from apps.news.services.news_service import NewsService
        mock_news = MagicMock()
        mock_news.slug = "test-slug"
        svc = NewsService()
        svc.delete_news(mock_news)
        mock_invalidate.assert_called_once()

    # ── get_all_categories ─────────────────────────────────────────────────────

    @patch("apps.news.services.news_service.NewsCategory.objects")
    def test_categories_cached(self, mock_objects):
        """Second call to get_all_categories should use cache."""
        from django.core.cache import cache as django_cache
        from apps.news.services.news_service import NewsService, _categories_key

        django_cache.set(_categories_key(), [{"id": 1, "name": "Tech"}], 1800)

        svc = NewsService()
        result = svc.get_all_categories()

        mock_objects.all.assert_not_called()
        self.assertEqual(result[0]["name"], "Tech")


@override_settings(CACHES=DUMMY_CACHES)
class RateLimitTest(TestCase):
    """Tests for the rate limiter with mocked Redis."""

    def test_allows_when_redis_down(self):
        """If Redis is down (get_redis returns None), rate limiter should allow."""
        with patch("infrastructure.rate_limit.get_redis", return_value=None):
            from infrastructure.rate_limit import is_rate_limited
            limited, count, retry = is_rate_limited("test:127.0.0.1:login", limit=5)
            self.assertFalse(limited)
            self.assertEqual(count, 0)

    def test_blocks_when_limit_exceeded(self):
        """Rate limiter blocks after limit is exceeded."""
        mock_redis = MagicMock()
        mock_pipeline = MagicMock()
        mock_pipeline.execute.return_value = [6, True]  # count=6 > limit=5
        mock_redis.pipeline.return_value = mock_pipeline

        with patch("infrastructure.rate_limit.get_redis", return_value=mock_redis):
            from infrastructure.rate_limit import is_rate_limited
            limited, count, retry = is_rate_limited("test:127.0.0.1:login", limit=5)
            self.assertTrue(limited)
            self.assertEqual(count, 6)
            self.assertGreater(retry, 0)

    def test_allows_within_limit(self):
        """Requests within limit are allowed."""
        mock_redis = MagicMock()
        mock_pipeline = MagicMock()
        mock_pipeline.execute.return_value = [3, True]  # count=3 < limit=5
        mock_redis.pipeline.return_value = mock_pipeline

        with patch("infrastructure.rate_limit.get_redis", return_value=mock_redis):
            from infrastructure.rate_limit import is_rate_limited
            limited, count, _ = is_rate_limited("test:127.0.0.1:login", limit=5)
            self.assertFalse(limited)
            self.assertEqual(count, 3)


@override_settings(CACHES=DUMMY_CACHES)
class DistributedLockTest(TestCase):
    """Tests for distributed lock context manager."""

    def test_yields_false_when_redis_down(self):
        """Lock should yield False (not crash) when Redis is unavailable."""
        with patch("infrastructure.distributed_lock.get_redis", return_value=None):
            from infrastructure.distributed_lock import acquire_lock
            with acquire_lock("test:resource") as acquired:
                self.assertFalse(acquired)

    def test_yields_true_when_acquired(self):
        """Lock should yield True when successfully acquired."""
        mock_redis = MagicMock()
        mock_lock = MagicMock()
        mock_lock.acquire.return_value = True
        mock_redis.lock.return_value = mock_lock

        with patch("infrastructure.distributed_lock.get_redis", return_value=mock_redis):
            from infrastructure.distributed_lock import acquire_lock
            with acquire_lock("test:resource") as acquired:
                self.assertTrue(acquired)
            mock_lock.release.assert_called_once()
