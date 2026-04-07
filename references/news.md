# News Domain Reference

Read this file for public news pages, news cache behavior, and admin news CRUD.

## Scope

- Public news list
- Public news detail
- News categories
- Admin news CRUD
- Redis cache behavior for news

## Frontend ownership

- Service: `frontend/src/features/news/services/news-service.ts`
- Types: `frontend/src/features/news/types.ts`
- List UI: `frontend/src/features/news/components/NewsList.tsx`
- Detail UI: `frontend/src/features/news/components/NewsDetail.tsx`
- Home section: `frontend/src/features/news/components/NewsSection.tsx`
- Route pages:
  - `frontend/src/app/(routes)/(main)/tin-tuc/page.tsx`
  - `frontend/src/app/(routes)/(main)/tin-tuc/[slug]/page.tsx`

## Backend ownership

- URLs: `backend/apps/news/urls.py`
- Views: `backend/apps/news/views/news.py`
- Service/cache logic: `backend/apps/news/services/news_service.py`
- Serializers: `backend/apps/news/serializers/news.py`
- Models: `backend/apps/news/models.py`

## Public APIs

- `GET /api/news/`
  - Query params: `category`, `search`, `exclude`, `offset`, `limit`
  - Returns list of serialized news items.
- `GET /api/news/categories/`
  - Returns category list.
- `GET /api/news/<slug>/`
  - Returns one published article or 404.

## Admin APIs

- `GET /api/admin/news/`
- `POST /api/admin/news/create/`
- `GET|PUT|DELETE /api/admin/news/<uuid>/`

## Behavior to remember

- Public list is cached by query params in `NewsService`, not by full HTTP response decorator.
- Public detail caches article PK by slug, then re-fetches the model from DB.
- Categories are cached separately with warm TTL.
- Admin create/update/delete invalidates list cache and relevant detail/category cache.

## Frontend behavior

- News list fetches categories once, then fetches paginated items with category + debounced search.
- "Load more" increments offset by page size 10.
- News detail fetches the article by slug, then optionally fetches related items by category.
- News detail page currently shows metadata and thumbnail from API, but body content is placeholder text rather than real article HTML/content.

## Backend filtering behavior

- Public list starts from `News.objects.filter(is_published=True).order_by("-published_at")`
- Category filter accepts numeric category id or category slug.
- Search matches `title` or `summary`.
- Exclude filter attempts to exclude by `id`.

## Cache details

- Key families:
  - `news:list:<hash>`
  - `news:detail:<slug>`
  - `news:categories`
- TTLs:
  - hot list/detail from `CACHE_TTL_HOT`
  - warm categories from `CACHE_TTL_WARM`
- Cache invalidation for list keys uses SCAN-based deletion through `django_redis`.

## Schema anchors

- Tables: `news_categories`, `news`
- Source of truth: `database/schema.sql`

## Gotchas

- Frontend `News` type expects `thumbnail_url`; backend cached list serializer helper also emits `image_url` field logic internally, so watch for naming drift if you touch serialization.
- News model in this snapshot does not expose a full article body field, which explains the placeholder content on detail pages.
- Admin endpoints require admin JWT auth through custom permission checks.
