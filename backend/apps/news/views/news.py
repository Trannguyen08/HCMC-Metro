"""
apps/news/views/news.py
────────────────────────
Public endpoints use @cache_page so the entire HTTP response is cached in
Redis (including headers).  TTL matches CACHE_TTL_HOT (5 min).

Admin write endpoints call NewsService which invalidates the cache,
so public readers see fresh data within one TTL cycle.

Rate limiting is applied to public list/detail routes (60 req/min per IP)
to protect against scraping.
"""
from __future__ import annotations

from django.conf import settings
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.news.services.news_service import NewsService
from apps.news.serializers.news import NewsSerializer, NewsCategorySerializer
from core.permissions import IsAdminUser
from infrastructure.rate_limit import rate_limit

news_service = NewsService()

_HOT_TTL: int = getattr(settings, "CACHE_TTL_HOT", 300)   # 5 min


# ── Public: List ──────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
@rate_limit(limit=60, window_seconds=60)
def public_news_list(request):
    """
    List published news.  Results are cached at the service layer (by params).
    @cache_page is intentionally NOT used here because the query string varies
    per request — per-param caching inside NewsService is more granular.
    """
    category = request.query_params.get("category")
    search = request.query_params.get("search")
    exclude_id = request.query_params.get("exclude")
    offset = request.query_params.get("offset", 0)
    limit = request.query_params.get("limit", 10)

    news = news_service.get_published_news(
        category=category,
        search=search,
        exclude_id=exclude_id,
        offset=offset,
        limit=limit,
    )
    # Service returns list[dict] when from cache, QuerySet when from DB.
    # NewsSerializer handles both (many=True, source data).
    if isinstance(news, list) and news and isinstance(news[0], dict):
        return Response(news)  # already serialized dicts from cache
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)


# ── Public: Detail ────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
@rate_limit(limit=120, window_seconds=60)
def public_news_detail(request, slug: str):
    """
    Single article.  PK cached in Redis; model is re-fetched (avoids pickle).
    """
    news = news_service.get_news_detail_by_slug(slug)
    if not news:
        return Response({"detail": "Tin tức không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    serializer = NewsSerializer(news)
    return Response(serializer.data)


# ── Public: Categories ────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def public_categories(request):
    """
    Categories list — WARM TTL (30 min), cached as list[dict].
    """
    categories = news_service.get_all_categories()
    # If it came from cache it's already list[dict], else serialize
    if categories and isinstance(categories[0], dict):
        return Response(categories)
    serializer = NewsCategorySerializer(categories, many=True)
    return Response(serializer.data)


# ── Admin: List & Create ──────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_news_list(request):
    # Admin always gets fresh data — no caching
    news = news_service.get_all_news_admin()
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_news_create(request):
    serializer = NewsSerializer(data=request.data)
    if serializer.is_valid():
        news_service.create_news(serializer.validated_data)  # invalidates cache
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Admin: Detail, Update, Delete ─────────────────────────────────────────────

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def admin_news_detail(request, pk: int):
    news = news_service.get_news_by_id(pk)
    if not news:
        return Response({"detail": "Không tìm thấy tin tức."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = NewsSerializer(news)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = NewsSerializer(news, data=request.data, partial=True)
        if serializer.is_valid():
            news_service.update_news(news, serializer.validated_data)  # invalidates cache
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        news_service.delete_news(news)  # invalidates cache
        return Response(status=status.HTTP_204_NO_CONTENT)
