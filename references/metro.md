# Metro Domain Reference

Read this file for metro map, stations, amenities, and route-related work.

## Scope

- Public amenity list/detail
- Station list and metro line data
- Admin amenity CRUD
- Metro map and route lookup UI

## Frontend ownership

- Amenity service: `frontend/src/features/metro/services/AmenityService.ts`
- Amenity hook: `frontend/src/hooks/useAmenities.ts`
- Amenity list page: `frontend/src/features/metro/components/StationAmenities.tsx`
- Amenity detail page: `frontend/src/features/metro/components/AmenityDetailPage.tsx`
- Metro helpers: `frontend/src/features/metro/utils/amenity.ts`
- Types: `frontend/src/types/amenity.ts`
- Mock fallback data: `frontend/src/lib/mock.ts`
- Main route pages:
  - `frontend/src/app/(routes)/(main)/tien-ich/page.tsx`
  - `frontend/src/app/(routes)/(main)/tien-ich/[id]/page.tsx`
  - `frontend/src/app/(routes)/(main)/ban-do-so/page.tsx`
  - `frontend/src/app/(routes)/(main)/lo-trinh/page.tsx`

## Backend ownership

- URLs: `backend/apps/metro/urls.py`
- Public views: `backend/apps/metro/views/aminity.py`
- Admin views: `backend/apps/metro/views/admin.py`
- Serializers and category mapping: `backend/apps/metro/serializers.py`
- Line cache service: `backend/apps/metro/services/metro_service.py`
- Models: `backend/apps/metro/models.py`

## Public APIs

- `GET /api/metro/stations/`
  - Returns station options for filters.
  - Serializer shape: `id=code`, `name`, `nameEn`, `line`.
- `GET /api/metro/amenities/`
  - Query params: `search`, `station`, `type`
  - Returns `{ data: Amenity[], total: number }`
- `GET /api/metro/amenities/<uuid>/`
  - Returns single amenity detail.

## Admin APIs

- `GET /api/admin/lines/`
- `GET /api/admin/amenity-types/`
- `GET /api/admin/amenities/`
- `POST /api/admin/amenities/create/`
- `GET|PUT|DELETE /api/admin/amenities/<uuid>/`

## Data contract notes

- Frontend amenity type union:
  - `all | cafe | restaurant | shopping | hotel | service`
- Backend maps DB amenity type names to frontend categories through alias matching in `AMENITY_TYPE_ALIASES`.
- Frontend post-processes amenity data with `buildAmenityDetail()` to derive:
  - `thumbnailUrl`
  - `overview`
  - `featuredImages`
  - `panoramaEmbedUrl`

## Behavior to remember

- Frontend uses backend first, then falls back to mock stations and amenities if requests fail or return empty data.
- Search in `useAmenities()` is debounced by 300ms.
- Amenity list UI currently logs card clicks instead of navigating directly from the card handler.
- Amenity detail page does real fetches, then renders a rich marketing-style page using derived fields.

## Backend query behavior

- Public amenity list filters by:
  - name, address, description via `icontains`
  - station code or numeric id
  - amenity type alias bucket
- Public amenity list orders by `distance_meters`, then `name`.
- Station list orders by `sequence_order`, then `id`.
- Metro line caching only applies to line/station aggregation in `MetroService`, not to amenity list/detail.

## Schema anchors

- Tables: `metro_lines`, `stations`, `amenity_types`, `amenities`, `amenity_images`
- Source of truth: `database/schema.sql`
- Django models are unmanaged mirrors of existing tables.

## Gotchas

- File name `aminity.py` is misspelled but active.
- Public amenity APIs use station code as the frontend-facing id, not necessarily DB integer ids.
- Mock data may mask backend failures, so verify whether results came from API or fallback when debugging.
